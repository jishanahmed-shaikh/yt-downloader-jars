'use client';

import { useState, useCallback } from 'react';
import { downloadStore } from '@/lib/download-store';

export function useDownloadManager() {
  const [loading, setLoading] = useState(false);

  const downloadSingle = useCallback(async (url: string, format: 'video' | 'audio') => {
    setLoading(true);
    const id = downloadStore.addToQueue(url, format);
    
    try {
      downloadStore.updateStatus(id, 'downloading');
      
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format }),
      });

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

  const downloadBatch = useCallback(async (urls: string[], format: 'video' | 'audio') => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/batch-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, format }),
      });

      const result = await response.json();
      
      if (result.success && result.results) {
        // Process each result
        result.results.forEach((item: any) => {
          const id = downloadStore.addToQueue(item.url, format);
          
          if (item.success) {
            if (item.type === 'playlist') {
              // Add each video from playlist to queue
              item.data.videos.forEach((video: any) => {
                const videoId = downloadStore.addToQueue(video.url, format);
                downloadStore.updateStatus(videoId, 'pending', {
                  title: video.title,
                  thumbnail: video.thumbnail,
                });
              });
              downloadStore.removeFromQueue(id); // Remove playlist entry
            } else {
              downloadStore.updateStatus(id, 'completed', {
                title: item.data.title,
                filename: item.data.filename,
                size: item.data.size,
                duration: item.data.duration,
                thumbnail: item.data.thumbnail,
              });
              downloadStore.completeDownload(id, item.data);
            }
          } else {
            downloadStore.updateStatus(id, 'error', {
              error: item.error?.message || 'Download failed',
            });
          }
        });
      }
    } catch (error) {
      console.error('Batch download error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    downloadSingle,
    downloadBatch,
  };
}