/**
 * @module downloader
 * @description Server-side wrapper around yt-dlp for probing, downloading, and
 * extracting audio from YouTube URLs. Handles binary resolution, filename
 * sanitization, ffmpeg integration, and error mapping.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { parseYtdlpError, createError, DownloadError } from './errors';

const execAsync = promisify(exec);

/** Metadata returned after a successful probe or download. */
export interface VideoMetadata {
  /** Video title (ASCII-safe, sanitized) */
  title: string;
  /** Duration in seconds */
  duration: number;
  /** Output filename (without directory) */
  filename: string;
  /** Absolute path to the downloaded file */
  filepath: string;
  /** File size in bytes */
  size: number;
  /** YouTube video ID */
  videoId: string;
  /** Thumbnail URL from YouTube */
  thumbnail?: string;
}

/** Unified result type returned by all public downloader functions. */
export interface DownloadResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Populated on success */
  data?: VideoMetadata;
  /** Populated on failure */
  error?: DownloadError;
}

/** Raw JSON shape returned by `yt-dlp --dump-json`. */
interface YtdlpInfo {
  id: string;
  title: string;
  duration: number;
  thumbnail?: string;
  filesize?: number;
  filesize_approx?: number;
}

/** Maximum allowed video duration in seconds (configurable via MAX_DURATION env var). */
const MAX_DURATION = parseInt(process.env.MAX_DURATION || '7200', 10); // 2 hours default

/**
 * Resolves the download output directory.
 * Supports relative paths (resolved from project root) and absolute paths.
 */
function getDownloadDir(): string {
  const dir = process.env.DOWNLOAD_DIR || '/tmp';
  if (dir.startsWith('./') || dir.startsWith('.\\')) {
    return path.join(process.cwd(), dir);
  }
  return dir;
}

/**
 * Sanitizes a video title into a safe filesystem filename.
 * - Strips all non-ASCII characters (Arabic, emoji, CJK, etc.)
 * - Removes shell-unsafe characters
 * - Collapses whitespace to underscores
 * - Truncates to 80 characters
 * - Falls back to `"download"` if the result is empty
 */
function sanitizeFilename(title: string): string {
  return title
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[<>:"/\\|?*#%&{}$!'`@=+]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 80) || 'download';
}

/** Returns the absolute path to the local `bin/` directory. */
function getBinDir(): string {
  return path.join(process.cwd(), 'bin');
}

/**
 * Resolves the yt-dlp executable path.
 * Prefers the bundled binary in `bin/`, falls back to the system PATH.
 */
function getYtdlpPath(): string {
  const isWindows = process.platform === 'win32';
  const ext = isWindows ? '.exe' : '';
  const binDir = getBinDir();

  const localBin = path.join(binDir, `yt-dlp${ext}`);
  if (fs.existsSync(localBin)) return localBin;

  const localBinNoExt = path.join(binDir, 'yt-dlp');
  if (fs.existsSync(localBinNoExt)) return localBinNoExt;

  return 'yt-dlp';
}

/**
 * Returns the directory containing the bundled ffmpeg binary, or `null` if
 * ffmpeg is not present in `bin/`. yt-dlp expects a directory path, not the
 * binary path itself.
 */
function getFfmpegLocation(): string | null {
  const isWindows = process.platform === 'win32';
  const ext = isWindows ? '.exe' : '';
  const binDir = getBinDir();

  const localFfmpeg = path.join(binDir, `ffmpeg${ext}`);
  if (fs.existsSync(localFfmpeg)) return binDir;
  return null;
}

/**
 * Verifies that yt-dlp is available and executable.
 * @returns The resolved yt-dlp path, or `null` if not found / not executable.
 */
async function checkYtdlp(): Promise<string | null> {
  const ytdlpPath = getYtdlpPath();
  try {
    await execAsync(`"${ytdlpPath}" --version`);
    return ytdlpPath;
  } catch {
    return null;
  }
}

/**
 * Probes a YouTube URL to retrieve video metadata without downloading.
 * Also enforces the MAX_DURATION limit.
 *
 * @param url - A valid YouTube video or playlist URL
 * @returns Metadata on success, or a structured error on failure
 */
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

/**
 * Downloads a YouTube video as an MP4 file.
 * Probes the video first to validate duration, then runs yt-dlp with the
 * requested quality format and merges streams via ffmpeg.
 *
 * @param url     - YouTube video URL
 * @param videoId - YouTube video ID (appended to the output filename)
 * @param quality - Quality selector: `'best'`, `'worst'`, or a height like `'720'`
 * @returns Metadata including the output filepath and file size
 */
export async function downloadVideo(url: string, videoId: string, quality: string = 'best'): Promise<DownloadResult> {
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

    // Build quality format string
    let formatString = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best';

    if (quality !== 'best' && quality !== 'worst') {
      // Specific quality requested (e.g., '1080', '720')
      formatString = `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]`;
    } else if (quality === 'worst') {
      formatString = 'worstvideo[ext=mp4]+worstaudio[ext=m4a]/worstvideo+worstaudio/worst';
    }

    // Download with specified quality and merge to MP4 for universal compatibility
    const command = `"${ytdlpPath}" ${ffmpegArg} -f "${formatString}" --merge-output-format mp4 -o "${filepath}" --no-warnings "${url}"`;

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

/**
 * Extracts and downloads audio from a YouTube video as an MP3 file.
 * Uses yt-dlp's `-x` flag with ffmpeg for conversion. Includes a fallback
 * directory scan in case yt-dlp produces a slightly different output filename.
 *
 * @param url     - YouTube video URL
 * @param videoId - YouTube video ID (appended to the output filename)
 * @param quality - Passed through but audio always uses best quality (0)
 * @returns Metadata including the output filepath and file size
 */
export async function downloadAudio(url: string, videoId: string, quality: string = 'best'): Promise<DownloadResult> {
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

    // Use base path without extension — yt-dlp adds .%(ext)s then converts to mp3
    const baseFilepath = filepath.replace('.mp3', '');
    const command = `"${ytdlpPath}" ${ffmpegArg} -x --audio-format mp3 --audio-quality 0 -o "${baseFilepath}.%(ext)s" --no-warnings "${url}"`;

    console.log('Running audio command:', command);
    await execAsync(command, { timeout: 300000 });

    // yt-dlp may produce the file with a slightly different name — find it
    let actualFilepath = filepath;
    if (!fs.existsSync(filepath)) {
      const files = fs.readdirSync(downloadDir);
      const match = files.find(f => f.startsWith(path.basename(baseFilepath)) && f.endsWith('.mp3'));
      if (match) {
        actualFilepath = path.join(downloadDir, match);
      } else {
        throw new Error(`Output file not found after download. Expected: ${filepath}`);
      }
    }

    const stats = fs.statSync(actualFilepath);

    return {
      success: true,
      data: {
        title,
        duration,
        filename: path.basename(actualFilepath),
        filepath: actualFilepath,
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
/**
 * Retrieves the list of videos in a YouTube playlist without downloading them.
 * Uses `--flat-playlist` for fast metadata extraction.
 *
 * @param url - A YouTube playlist URL
 * @returns Playlist metadata with an array of video entries, or an error
 */
export async function getPlaylistInfo(url: string): Promise<{ success: boolean; data?: any; error?: any }> {
  const ytdlpPath = await checkYtdlp();
  if (!ytdlpPath) {
    return {
      success: false,
      error: createError('YTDLP_NOT_FOUND', 'yt-dlp is not installed on the server'),
    };
  }

  try {
    const { stdout, stderr } = await execAsync(
      `"${ytdlpPath}" --flat-playlist --dump-json --no-warnings "${url}"`,
      { timeout: 60000 }
    );

    if (stderr && !stdout) {
      return { success: false, error: parseYtdlpError(stderr) };
    }

    const lines = stdout.trim().split('\n').filter(line => line.trim());
    const videos = lines.map(line => {
      try {
        const info = JSON.parse(line);
        return {
          id: info.id,
          title: info.title || 'Unknown Title',
          url: `https://www.youtube.com/watch?v=${info.id}`,
          thumbnail: info.thumbnail || '',
          duration: info.duration || 0,
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    if (videos.length === 0) {
      return { success: false, error: createError('INVALID_URL', 'No videos found in playlist') };
    }

    return {
      success: true,
      data: {
        id: Math.random().toString(36).substr(2, 9),
        title: `Playlist (${videos.length} videos)`,
        videoCount: videos.length,
        videos,
      },
    };
  } catch (error: unknown) {
    const err = error as { stderr?: string; message?: string };
    return {
      success: false,
      error: createError('PROBE_FAILED', 'Failed to get playlist info', err.message),
    };
  }
}