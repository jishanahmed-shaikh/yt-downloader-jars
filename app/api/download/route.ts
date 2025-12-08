import { NextRequest, NextResponse } from 'next/server';
import { validateYouTubeUrl } from '@/lib/validator';
import { downloadVideo } from '@/lib/downloader';
import { createError } from '@/lib/errors';

export const maxDuration = 60; // Vercel serverless timeout

interface DownloadRequest {
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DownloadRequest = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: createError('INVALID_URL', 'URL is required'),
        },
        { status: 400 }
      );
    }

    // Validate URL
    const validation = validateYouTubeUrl(url);
    if (!validation.valid || !validation.videoId) {
      return NextResponse.json(
        {
          success: false,
          error: createError('INVALID_URL', validation.error || 'Invalid YouTube URL'),
        },
        { status: 400 }
      );
    }

    // Download video
    const result = await downloadVideo(url, validation.videoId);

    if (!result.success) {
      const statusCode = result.error?.code === 'PRIVATE_VIDEO' || 
                         result.error?.code === 'UNAVAILABLE' ||
                         result.error?.code === 'AGE_RESTRICTED' ? 403 : 500;
      
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      filename: result.data?.filename,
      filepath: result.data?.filepath,
      size: result.data?.size,
      title: result.data?.title,
      duration: result.data?.duration,
      videoId: result.data?.videoId,
      thumbnail: result.data?.thumbnail,
    });
  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: createError('UNKNOWN', 'An unexpected error occurred'),
      },
      { status: 500 }
    );
  }
}
