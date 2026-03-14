'use client';

/**
 * @module use-download-manager
 * @description React hook that orchestrates all download operations.
 * Bridges the UI layer with the download API routes and the `downloadStore`.
 *
 * Responsibilities:
 * - Single and batch download flows
 * - Simulated progress updates for better UX
 * - Automatic browser save-dialog triggers (when auto-download is enabled)
 * - Browser notification dispatch on completion
 * - Fallback individual processing when the batch API fails
 */

import { useState, useCallback, useEffect } from 'react';
import { downloadStore } from '@/lib/download-store';

/**
 * Hook that provides download actions and a loading flag to UI components.
 *
 * @returns
 * - `loading` — true while any download operation is in progress
 * - `downloadSingle` — download one URL (video or audio)
 * - `downloadBatch` — download multiple URLs via the batch API
 * - `processPendingDownloads` — retry all pending items in the queue
 */
export function useDownloadManager() {
  const [loading, setLoading] = useState(false);

  /** Fires a browser notification when a download completes (if permission granted). */
  const showNotification = (title: string, filename: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Download Complete! 🎉', {
        body: `${title} has finished downloading`,
        icon: '/favicon.ico',
        tag: 'download-complete'
      });
    }
  };

  // Request notification permission on first load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  /**
   * Programmatically triggers a browser save dialog for a completed file.
   * Creates a temporary `<a>` element, clicks it, then removes it.
   */
  const triggerDownload = (filename: string, title: string) => {
    const link = document.createElement('a');
    link.href = `/api/serve/${encodeURIComponent(filename)}`;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB limit

  /**
   * Downloads a single YouTube URL.
   * Adds the item to the queue, simulates progress, calls `/api/download`,
   * then triggers auto-download and a browser notification on success.
   *
   * @param url     - YouTube URL
   * @param format  - `'video'` or `'audio'`
   * @param quality - Quality selector (default `'best'`)
   */
  const downloadSingle = useCallback(async (url: string, format: 'video' | 'audio', quality: string = 'best') => {
    setLoading(true);

    const id = downloadStore.addToQueue(url, format, quality);

    try {
      downloadStore.updateStatus(id, 'downloading');

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        const currentItem = downloadStore.getQueue().find(item => item.id === id);
        if (currentItem && currentItem.progress < 90) {
          downloadStore.updateProgress(id, Math.min(currentItem.progress + Math.random() * 20, 90));
        }
      }, 500);

      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format, quality }),
      });

      clearInterval(progressInterval);
      downloadStore.updateProgress(id, 100);

      const result = await response.json();

      if (result.success) {
        downloadStore.updateStatus(id, 'completed', {
          title: result.title,
          filename: result.filename,
          size: result.size,
          duration: result.duration,
          thumbnail: result.thumbnail,
        });
        downloadStore.completeDownload(id, result);

        // Automatically trigger download
        if (result.filename && downloadStore.getAutoDownload()) {
          setTimeout(() => triggerDownload(result.filename, result.title), 500);
        }

        // Show notification
        if (result.title) {
          showNotification(result.title, result.filename || '');
        }
      } else {
        downloadStore.updateStatus(id, 'error', {
          error: result.error?.message || 'Download failed',
        });
      }
    } catch (error) {
      downloadStore.updateStatus(id, 'error', {
        error: 'Network error occurred',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Downloads multiple URLs via the `/api/batch-download` endpoint.
   * Falls back to `processBatchIndividually` if the batch API fails.
   *
   * @param urls    - Array of YouTube URLs (max 10)
   * @param format  - `'video'` or `'audio'`
   * @param quality - Quality selector (default `'best'`)
   */
  const downloadBatch = useCallback(async (urls: string[], format: 'video' | 'audio', quality: string = 'best') => {
    setLoading(true);

    try {
      // Use the batch-download API for better handling of playlists and multiple URLs
      const response = await fetch('/api/batch-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, format, quality }),
      });

      const result = await response.json();

      if (result.success && result.results) {
        // Process each result and add to queue
        result.results.forEach((item: any, index: number) => {
          const id = downloadStore.addToQueue(urls[index], format);

          if (item.success) {
            if (item.type === 'playlist' && item.data) {
              // Handle playlist - mark main item as completed and add individual videos
              downloadStore.updateStatus(id, 'completed', {
                title: `${item.data.title} (${item.data.videoCount} videos)`,
              });

              // Add each video from playlist to queue as pending
              item.data.videos.forEach((video: any, videoIndex: number) => {
                const videoId = downloadStore.addToQueue(video.url, format, quality);
                downloadStore.updateStatus(videoId, 'pending', {
                  title: `${videoIndex + 1}. ${video.title}`,
                  thumbnail: video.thumbnail,
                });
              });
            } else if (item.type === 'video' && item.data) {
              // Handle regular video - mark as completed
              downloadStore.updateStatus(id, 'completed', {
                title: item.data.title,
                filename: item.data.filename,
                size: item.data.size,
                duration: item.data.duration,
                thumbnail: item.data.thumbnail,
              });
              downloadStore.completeDownload(id, item.data);

              // Automatically trigger download with delay to avoid overwhelming browser
              if (item.data.filename && downloadStore.getAutoDownload()) {
                setTimeout(() => triggerDownload(item.data.filename, item.data.title), 1000 + (index * 2000));
              }

              // Show notification
              if (item.data.title) {
                setTimeout(() => showNotification(item.data.title, item.data.filename || ''), 1000 + (index * 2000));
              }
            }
          } else {
            // Handle failed download
            downloadStore.updateStatus(id, 'error', {
              error: item.error?.message || 'Download failed',
            });
          }
        });
      } else {
        // If batch API fails, fall back to individual processing
        console.log('Batch API failed, falling back to individual processing');
        await processBatchIndividually(urls, format, quality);
      }
    } catch (error) {
      console.error('Batch download error:', error);
      // Fall back to individual processing
      await processBatchIndividually(urls, format, quality);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fallback: processes each URL sequentially via `/api/download`.
   * Used when the batch API is unavailable or returns an error.
   * Adds a 1-second delay between requests to avoid overwhelming the server.
   */
  const processBatchIndividually = async (urls: string[], format: 'video' | 'audio', quality: string) => {
    const queueIds: string[] = [];
    urls.forEach(url => {
      const id = downloadStore.addToQueue(url, format, quality);
      queueIds.push(id);
    });

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const id = queueIds[i];

      try {
        downloadStore.updateStatus(id, 'downloading');

        // Progress simulation for better UX
        const progressInterval = setInterval(() => {
          const currentItem = downloadStore.getQueue().find(item => item.id === id);
          if (currentItem && currentItem.progress < 90) {
            downloadStore.updateProgress(id, Math.min(currentItem.progress + Math.random() * 15, 90));
          }
        }, 300);

        const response = await fetch('/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, format, quality }),
        });

        clearInterval(progressInterval);
        downloadStore.updateProgress(id, 100);

        const result = await response.json();

        if (result.success) {
          downloadStore.updateStatus(id, 'completed', {
            title: result.title,
            filename: result.filename,
            size: result.size,
            duration: result.duration,
            thumbnail: result.thumbnail,
          });
          downloadStore.completeDownload(id, result);

          // Automatically trigger download with delay
          if (result.filename && downloadStore.getAutoDownload()) {
            setTimeout(() => triggerDownload(result.filename, result.title), 1000 + (i * 2000));
          }

          // Show notification
          if (result.title) {
            setTimeout(() => showNotification(result.title, result.filename || ''), 1000 + (i * 2000));
          }
        } else {
          downloadStore.updateStatus(id, 'error', {
            error: result.error?.message || 'Download failed',
          });
        }
      } catch (error) {
        console.error('Error downloading URL:', url, error);
        downloadStore.updateStatus(id, 'error', {
          error: 'Network error occurred',
        });
      }

      // Small delay between downloads to prevent overwhelming the server
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  /**
   * Processes all items currently in `'pending'` status in the queue.
   * Useful for retrying after a failure or for playlist video processing.
   */
  const processPendingDownloads = useCallback(async () => {
    const queue = downloadStore.getQueue();
    const pendingItems = queue.filter(item => item.status === 'pending');

    for (const item of pendingItems) {
      if (item.status === 'pending') {
        try {
          downloadStore.updateStatus(item.id, 'downloading');

          const progressInterval = setInterval(() => {
            const currentItem = downloadStore.getQueue().find(i => i.id === item.id);
            if (currentItem && currentItem.progress < 90) {
              downloadStore.updateProgress(item.id, Math.min(currentItem.progress + Math.random() * 10, 90));
            }
          }, 400);

          const response = await fetch('/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: item.url, format: item.format }),
          });

          clearInterval(progressInterval);
          downloadStore.updateProgress(item.id, 100);

          const result = await response.json();

          if (result.success) {
            downloadStore.updateStatus(item.id, 'completed', {
              title: result.title,
              filename: result.filename,
              size: result.size,
              duration: result.duration,
              thumbnail: result.thumbnail,
            });
            downloadStore.completeDownload(item.id, result);

            // Automatically trigger download
            if (result.filename && downloadStore.getAutoDownload()) {
              setTimeout(() => triggerDownload(result.filename, result.title), 500);
            }

            // Show notification
            if (result.title) {
              showNotification(result.title, result.filename || '');
            }
          } else {
            downloadStore.updateStatus(item.id, 'error', {
              error: result.error?.message || 'Download failed',
            });
          }
        } catch (error) {
          downloadStore.updateStatus(item.id, 'error', {
            error: 'Network error occurred',
          });
        }

        // Delay between downloads
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }, []);

  return {
    loading,
    downloadSingle,
    downloadBatch,
    processPendingDownloads,
  };
}