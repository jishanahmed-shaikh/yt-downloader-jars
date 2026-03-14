/**
 * @file validator.ts
 * @description YouTube URL validation utilities.
 *
 * Validates that a given URL belongs to a supported YouTube domain and
 * extracts the 11-character video ID used by yt-dlp for downloading.
 */

/** Result returned by `validateYouTubeUrl`. */
export interface ValidationResult {
  valid: boolean;
  /** Extracted 11-char YouTube video ID, present when `valid` is true. */
  videoId?: string;
  /** Human-readable reason for failure, present when `valid` is false. */
  error?: string;
}

/** All accepted YouTube hostnames. */
const YOUTUBE_DOMAINS = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'];

/**
 * Regex patterns that match supported YouTube URL formats and capture
 * the 11-character video ID in group 1.
 */
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

/**
 * Returns true if the URL's hostname is a recognised YouTube domain.
 */
export function isValidDomain(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return YOUTUBE_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
}

/**
 * Attempts to extract the 11-character video ID from a YouTube URL.
 * Returns `null` if no pattern matches (e.g. playlist-only URLs).
 */
export function extractVideoId(url: string): string | null {
  for (const pattern of URL_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

/**
 * Validates a YouTube URL end-to-end:
 * 1. Checks it is a non-empty string with an http(s) scheme
 * 2. Verifies the hostname is a known YouTube domain
 * 3. Extracts and returns the video ID
 *
 * @param url - Raw URL string from user input
 * @returns `ValidationResult` with `valid`, optional `videoId`, and optional `error`
 */
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
