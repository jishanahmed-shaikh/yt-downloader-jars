import { NextRequest, NextResponse } from 'next/server';
import { validateYouTubeUrl } from '@/lib/validator';
import { downloadVideo, downloadAudio, getPlaylistInfo } from '@/lib/downloader';
import { createError } from '@/lib/errors';

export const maxDuration = 300; // 5 minutes for batch

interface BatchDownloadRequest {
  urls: string[];
  format: 'video' | 'audio';
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchDownloadRequest = await request.json();
    const { urls, format = 'video' } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: createError('INVALID_URL', 'URLs array is required'),
        },
        { status: 400 }
      );
    }

    if (urls.length > 10) {
      return NextResponse.json(
        {
          success: false,
          error: createError('INVALID_URL', 'Maximum 10 URLs allowed per batch'),
        },
        { status: 400 }
      );
    }

    const results = [];

    for (const url of urls) {
      try {
        // Check if it's a playlist
        if (url.includes('playlist?list=') || url.includes('&list=')) {
          const playlistResult = await getPlaylistInfo(url);
          if (playlistResult.success && playlistResult.data) {
            results.push({
              url,
              success: true,
              type: 'playlist',
              data: playlistResult.data,
            });
            continue;
          }
        }

        // Validate single video URL
        const validation = validateYouTubeUrl(url);
        if (!validation.valid || !validation.videoId) {
          results.push({
            url,
            success: false,
            error: createError('INVALID_URL', validation.error || 'Invalid YouTube URL'),
          });
          continue;
        }

        // Download video/audio
        const result = format === 'audio' 
          ? await downloadAudio(url, validation.videoId)
          : await downloadVideo(url, validation.videoId);

        results.push({
          url,
          success: result.success,
          type: 'video',
          data: result.data,
          error: result.error,
        });

      } catch (error) {
        results.push({
          url,
          success: false,
          error: createError('DOWNLOAD_FAILED', 'Failed to process URL'),
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: successCount > 0,
      processed: results.length,
      successful: successCount,
      failed: results.length - successCount,
      results,
    });

  } catch (error) {
    console.error('Batch download error:', error);
    return NextResponse.json(
      {
        success: false,
        error: createError('UNKNOWN', 'An unexpected error occurred'),
      },
      { status: 500 }
    );
  }
}