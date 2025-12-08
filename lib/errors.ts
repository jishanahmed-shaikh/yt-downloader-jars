export type ErrorCode =
  | 'PRIVATE_VIDEO'
  | 'UNAVAILABLE'
  | 'AGE_RESTRICTED'
  | 'INVALID_URL'
  | 'DOWNLOAD_FAILED'
  | 'PROBE_FAILED'
  | 'YTDLP_NOT_FOUND'
  | 'UNKNOWN';

export interface DownloadError {
  code: ErrorCode;
  message: string;
  details?: string;
}

const ERROR_PATTERNS: { pattern: RegExp; code: ErrorCode; message: string }[] = [
  {
    pattern: /private video|video is private|sign in to confirm/i,
    code: 'PRIVATE_VIDEO',
    message: 'This video is private and cannot be downloaded',
  },
  {
    pattern: /video unavailable|removed|does not exist|not available|been removed|no longer available/i,
    code: 'UNAVAILABLE',
    message: 'This video is unavailable or has been removed',
  },
  {
    pattern: /age-restricted|age restricted|confirm your age|age gate|sign in to confirm your age/i,
    code: 'AGE_RESTRICTED',
    message: 'This video is age-restricted and cannot be downloaded without authentication',
  },
  {
    pattern: /copyright|blocked|not available in your country/i,
    code: 'UNAVAILABLE',
    message: 'This video is blocked or not available in your region',
  },
];

export function parseYtdlpError(stderr: string): DownloadError {
  for (const { pattern, code, message } of ERROR_PATTERNS) {
    if (pattern.test(stderr)) {
      return { code, message, details: stderr };
    }
  }

  return {
    code: 'UNKNOWN',
    message: 'An unexpected error occurred while processing the video',
    details: stderr,
  };
}

export function createError(code: ErrorCode, message: string, details?: string): DownloadError {
  return { code, message, details };
}

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  PRIVATE_VIDEO: 'This video is private and cannot be downloaded',
  UNAVAILABLE: 'This video is unavailable or has been removed',
  AGE_RESTRICTED: 'This video is age-restricted and cannot be downloaded',
  INVALID_URL: 'Please enter a valid YouTube URL',
  DOWNLOAD_FAILED: 'Failed to download video. Please try again',
  PROBE_FAILED: 'Could not retrieve video information',
  YTDLP_NOT_FOUND: 'yt-dlp is not installed on the server',
  UNKNOWN: 'An unexpected error occurred',
};
