import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { parseYtdlpError, createError, DownloadError } from './errors';

const execAsync = promisify(exec);

export interface VideoMetadata {
  title: string;
  duration: number;
  filename: string;
  filepath: string;
  size: number;
  videoId: string;
  thumbnail?: string;
}

export interface DownloadResult {
  success: boolean;
  data?: VideoMetadata;
  error?: DownloadError;
}

interface YtdlpInfo {
  id: string;
  title: string;
  duration: number;
  thumbnail?: string;
  filesize?: number;
  filesize_approx?: number;
}

const MAX_DURATION = parseInt(process.env.MAX_DURATION || '3600', 10);

function getDownloadDir(): string {
  const dir = process.env.DOWNLOAD_DIR || '/tmp';
  // Resolve relative paths from project root
  if (dir.startsWith('./') || dir.startsWith('.\\')) {
    return path.join(process.cwd(), dir);
  }
  return dir;
}

function sanitizeFilename(title: string): string {
  return title
    .replace(/[<>:"/\\|?*#%&{}$!'`@=+]/g, '') // Remove URL-unsafe and filesystem-unsafe chars
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_') // Collapse multiple underscores
    .substring(0, 80);
}

function getBinDir(): string {
  return path.join(process.cwd(), 'bin');
}

function getYtdlpPath(): string {
  const isWindows = process.platform === 'win32';
  const ext = isWindows ? '.exe' : '';
  const binDir = getBinDir();
  
  // Check local bin directory first (for bundled yt-dlp)
  const localBin = path.join(binDir, `yt-dlp${ext}`);
  if (fs.existsSync(localBin)) {
    return localBin;
  }
  
  // Check without extension (Linux/Mac)
  const localBinNoExt = path.join(binDir, 'yt-dlp');
  if (fs.existsSync(localBinNoExt)) {
    return localBinNoExt;
  }
  
  // Fall back to system yt-dlp
  return 'yt-dlp';
}

function getFfmpegLocation(): string | null {
  const isWindows = process.platform === 'win32';
  const ext = isWindows ? '.exe' : '';
  const binDir = getBinDir();
  
  const localFfmpeg = path.join(binDir, `ffmpeg${ext}`);
  if (fs.existsSync(localFfmpeg)) {
    return binDir; // Return directory, not file path
  }
  return null;
}

async function checkYtdlp(): Promise<string | null> {
  const ytdlpPath = getYtdlpPath();
  try {
    await execAsync(`"${ytdlpPath}" --version`);
    return ytdlpPath;
  } catch {
    return null;
  }
}

export async function probeVideo(url: string): Promise<DownloadResult> {
  const ytdlpPath = await checkYtdlp();
  if (!ytdlpPath) {
    return {
      success: false,
      error: createError('YTDLP_NOT_FOUND', 'yt-dlp is not installed on the server'),
    };
  }

  try {
    const { stdout, stderr } = await execAsync(
      `"${ytdlpPath}" --dump-json --no-download --no-warnings "${url}"`,
      { timeout: 30000 }
    );

    if (stderr && !stdout) {
      return { success: false, error: parseYtdlpError(stderr) };
    }

    const info: YtdlpInfo = JSON.parse(stdout);

    if (info.duration && info.duration > MAX_DURATION) {
      return {
        success: false,
        error: createError(
          'DOWNLOAD_FAILED',
          `Video is too long (${Math.round(info.duration / 60)} minutes). Maximum allowed is ${Math.round(MAX_DURATION / 60)} minutes.`
        ),
      };
    }

    return {
      success: true,
      data: {
        title: info.title,
        duration: info.duration || 0,
        filename: '',
        filepath: '',
        size: 0,
        videoId: info.id,
        thumbnail: info.thumbnail,
      },
    };
  } catch (error: unknown) {
    const err = error as { stderr?: string; message?: string };
    if (err.stderr) {
      return { success: false, error: parseYtdlpError(err.stderr) };
    }
    return {
      success: false,
      error: createError('PROBE_FAILED', 'Could not retrieve video information', err.message),
    };
  }
}

export async function downloadVideo(url: string, videoId: string): Promise<DownloadResult> {
  const ytdlpPath = await checkYtdlp();
  if (!ytdlpPath) {
    return {
      success: false,
      error: createError('YTDLP_NOT_FOUND', 'yt-dlp is not installed on the server'),
    };
  }

  const probeResult = await probeVideo(url);
  if (!probeResult.success || !probeResult.data) {
    return probeResult;
  }

  const { title, duration, thumbnail } = probeResult.data;
  const safeFilename = `${sanitizeFilename(title)}_${videoId}.mp4`;
  const downloadDir = getDownloadDir();
  const filepath = path.join(downloadDir, safeFilename);

  try {
    // Build command with ffmpeg location if available locally
    const ffmpegDir = getFfmpegLocation();
    const ffmpegArg = ffmpegDir ? `--ffmpeg-location "${ffmpegDir}"` : '';
    
    // Download best quality and merge to MP4 for universal compatibility
    const command = `"${ytdlpPath}" ${ffmpegArg} -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best" --merge-output-format mp4 -o "${filepath}" --no-warnings "${url}"`;
    
    console.log('Running command:', command);
    await execAsync(command, { timeout: 300000 }); // 5 minute timeout

    // Get file size
    const stats = fs.statSync(filepath);

    return {
      success: true,
      data: {
        title,
        duration,
        filename: safeFilename,
        filepath,
        size: stats.size,
        videoId,
        thumbnail,
      },
    };
  } catch (error: unknown) {
    const err = error as { stderr?: string; message?: string };
    if (err.stderr) {
      return { success: false, error: parseYtdlpError(err.stderr) };
    }
    return {
      success: false,
      error: createError('DOWNLOAD_FAILED', 'Failed to download video', err.message),
    };
  }
}

export async function downloadAudio(url: string, videoId: string): Promise<DownloadResult> {
  const ytdlpPath = await checkYtdlp();
  if (!ytdlpPath) {
    return {
      success: false,
      error: createError('YTDLP_NOT_FOUND', 'yt-dlp is not installed on the server'),
    };
  }

  const probeResult = await probeVideo(url);
  if (!probeResult.success || !probeResult.data) {
    return probeResult;
  }

  const { title, duration, thumbnail } = probeResult.data;
  const safeFilename = `${sanitizeFilename(title)}_${videoId}.mp3`;
  const downloadDir = getDownloadDir();
  const filepath = path.join(downloadDir, safeFilename);

  try {
    const ffmpegDir = getFfmpegLocation();
    const ffmpegArg = ffmpegDir ? `--ffmpeg-location "${ffmpegDir}"` : '';
    
    // Download audio only and convert to MP3
    const command = `"${ytdlpPath}" ${ffmpegArg} -x --audio-format mp3 --audio-quality 0 -o "${filepath.replace('.mp3', '.%(ext)s')}" --no-warnings "${url}"`;
    
    console.log('Running audio command:', command);
    await execAsync(command, { timeout: 300000 });

    // Get file size
    const stats = fs.statSync(filepath);

    return {
      success: true,
      data: {
        title,
        duration,
        filename: safeFilename,
        filepath,
        size: stats.size,
        videoId,
        thumbnail,
      },
    };
  } catch (error: unknown) {
    const err = error as { stderr?: string; message?: string };
    if (err.stderr) {
      return { success: false, error: parseYtdlpError(err.stderr) };
    }
    return {
      success: false,
      error: createError('DOWNLOAD_FAILED', 'Failed to download audio', err.message),
    };
  }
}
