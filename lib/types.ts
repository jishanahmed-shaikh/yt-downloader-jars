export interface DownloadItem {
  id: string;
  url: string;
  format: 'video' | 'audio';
  quality?: string; // video quality like '720p', '1080p', 'best'
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress: number;
  title?: string;
  thumbnail?: string;
  filename?: string;
  size?: number;
  duration?: number;
  error?: string;
  createdAt: Date;
  downloadSpeed?: number; // bytes per second
  eta?: number; // estimated time remaining in seconds
  startTime?: Date;
}

export interface DownloadHistory {
  id: string;
  title: string;
  url: string;
  format: 'video' | 'audio';
  filename: string;
  size: number;
  duration: number;
  downloadedAt: Date;
}

export interface PlaylistInfo {
  id: string;
  title: string;
  videoCount: number;
  videos: Array<{
    id: string;
    title: string;
    url: string;
    thumbnail: string;
    duration: number;
  }>;
}