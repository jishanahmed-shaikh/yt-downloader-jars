export interface ValidationResult {
  valid: boolean;
  videoId?: string;
  error?: string;
}

const YOUTUBE_DOMAINS = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'];

const URL_PATTERNS = [
  // Standard watch URL: youtube.com/watch?v=VIDEO_ID
  /(?:youtube\.com|www\.youtube\.com|m\.youtube\.com)\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  // Shorts URL: youtube.com/shorts/VIDEO_ID
  /(?:youtube\.com|www\.youtube\.com|m\.youtube\.com)\/shorts\/([a-zA-Z0-9_-]{11})/,
  // Short URL: youtu.be/VIDEO_ID
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  // Embed URL: youtube.com/embed/VIDEO_ID
  /(?:youtube\.com|www\.youtube\.com)\/embed\/([a-zA-Z0-9_-]{11})/,
];

export function isValidDomain(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return YOUTUBE_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
}

export function extractVideoId(url: string): string | null {
  for (const pattern of URL_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

export function validateYouTubeUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmedUrl = url.trim();

  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    return { valid: false, error: 'URL must start with http:// or https://' };
  }

  if (!isValidDomain(trimmedUrl)) {
    return { valid: false, error: 'URL must be from youtube.com or youtu.be' };
  }

  const videoId = extractVideoId(trimmedUrl);
  if (!videoId) {
    return { valid: false, error: 'Could not extract video ID from URL' };
  }

  return { valid: true, videoId };
}
