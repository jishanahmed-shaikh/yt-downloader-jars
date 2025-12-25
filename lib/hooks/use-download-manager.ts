'use client';

import { useState, useCallback } from 'react';
import { downloadStore } from '@/lib/download-store';

import { validateYouTubeUrl } from '@/lib/validator';

function isPlaylistUrl(url: string): boolean {
  return url.includes('playlist?list=') || url.includes('&list=');
}

export function useDownloadManager() {
  const [loading, setLoading] = useState(false);

  const downloadSingle = useCallback(async (url: string, format: 'video' | 'audio') => {
    setLoading(true);
    
    // Check if it's a playlist URL
    if (isPlaylistUrl(url)) {
      await downloadBatch([url], format);
      setLoading(false);
      return;
    }
    
    const id = downloadStore.addToQueue(url, format);
    
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
        body: JSON.stringify({ url, format }),
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
    
    // Add all URLs to queue first
    const queueIds: string[] = [];
    urls.forEach(url => {
      const id = downloadStore.addToQueue(url, format);
      queueIds.push(id);
    });
    
    try {
      // Process each URL individually with progress tracking
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const id = queueIds[i];
        
        try {
          downloadStore.updateStatus(id, 'downloading');
          
          // Check if it's a playlist
          if (isPlaylistUrl(url)) {
            const response = await fetch('/api/batch-download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ urls: [url], format }),
            });

            const result = await response.json();
            
            if (result.success && result.results?.[0]?.success && result.results[0].type === 'playlist') {
              const playlistData = result.results[0].data;
              
              // Update original item to show playlist info
              downloadStore.updateStatus(id, 'completed', {
                title: `${playlistData.title} (${playlistData.videoCount} videos)`,
              });
              
              // Add each video from playlist to queue
              playlistData.videos.forEach((video: any, index: number) => {
                const videoId = downloadStore.addToQueue(video.url, format);
                downloadStore.updateStatus(videoId, 'pending', {
                  title: `${index + 1}. ${video.title}`,
                  thumbnail: video.thumbnail,
                });
              });
            } else {
              downloadStore.updateStatus(id, 'error', {
                error: 'Failed to process playlist',
              });
            }
          } else {
            // Regular video download with progress simulation
            const progressInterval = setInterval(() => {
              const currentItem = downloadStore.getQueue().find(item => item.id === id);
              if (currentItem && currentItem.progress < 90) {
                downloadStore.updateProgress(id, Math.min(currentItem.progress + Math.random() * 15, 90));
              }
            }, 300);
            
            const response = await fetch('/api/download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url, format }),
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
            } else {
              downloadStore.updateStatus(id, 'error', {
                error: result.error?.message || 'Download failed',
              });
            }
          }
        } catch (error) {
          downloadStore.updateStatus(id, 'error', {
            error: 'Network error occurred',
          });
        }
        
        // Small delay between downloads to prevent overwhelming the server
        if (i < urls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('Batch download error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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