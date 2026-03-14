/**
 * Represents a single item in the active download queue.
 * Tracks all state from pending through completion or error.
 */
export interface DownloadItem {
  /** Unique identifier for this queue item */
  id: string;
  /** YouTube URL to download */
  url: string;
  /** Output format — video (MP4) or audio (MP3) */
  format: 'video' | 'audio';
  /** Requested quality, e.g. '720', '1080', 'best', 'worst' */
  quality?: string;
  /** Current lifecycle status of the download */
  status: 'pending' | 'downloading' | 'completed' | 'error';
  /** Download progress as a percentage (0–100) */
  progress: number;
  /** Video title, populated after probing */
  title?: string;
  /** Thumbnail URL from YouTube */
  thumbnail?: string;
  /** Output filename on the server */
  filename?: string;
  /** File size in bytes */
  size?: number;
  /** Video duration in seconds */
  duration?: number;
  /** Human-readable error message if status is 'error' */
  error?: string;
  /** Timestamp when the item was added to the queue */
  createdAt: Date;
  /** Current download speed in bytes per second */
  downloadSpeed?: number;
  /** Estimated seconds remaining until completion */
  eta?: number;
  /** Timestamp when the download actually started */
  startTime?: Date;
}

/**
 * A completed download entry stored in persistent history.
 */
export interface DownloadHistory {
  /** Unique identifier for this history entry */
  id: string;
  /** Video title */
  title: string;
  /** Original YouTube URL */
  url: string;
  /** Format that was downloaded */
  format: 'video' | 'audio';
  /** Filename on the server */
  filename: string;
  /** File size in bytes */
  size: number;
  /** Video duration in seconds */
  duration: number;
  /** Timestamp when the download completed */
  downloadedAt: Date;
}

/**
 * A saved download preset for quickly reusing format/quality settings.
 */
export interface DownloadPreset {
  /** Unique identifier */
  id: string;
  /** User-defined label for this preset */
  name: string;
  /** Default format for this preset */
  format: 'video' | 'audio';
  /** Default quality for this preset */
  quality: string;
  /** Whether auto-download is enabled for this preset */
  autoDownload: boolean;
  /** Timestamp when the preset was created */
  createdAt: Date;
}

/**
 * Aggregated statistics derived from the download history.
 */
export interface DownloadStats {
  /** Total number of completed downloads */
  totalDownloads: number;
  /** Total bytes downloaded across all history entries */
  totalDataDownloaded: number;
  /** Success rate as a percentage (always 100 — only successes are stored) */
  successRate: number;
  /** Average file size in bytes */
  averageFileSize: number;
  /** The format downloaded most frequently */
  mostDownloadedFormat: 'video' | 'audio';
  /** Number of downloads completed today */
  todayDownloads: number;
}

/**
 * Metadata for a YouTube playlist, including its constituent videos.
 */
export interface PlaylistInfo {
  /** Unique identifier for the playlist */
  id: string;
  /** Playlist title */
  title: string;
  /** Total number of videos in the playlist */
  videoCount: number;
  /** Individual video entries within the playlist */
  videos: Array<{
    id: string;
    title: string;
    url: string;
    thumbnail: string;
    duration: number;
  }>;
}