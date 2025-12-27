'use client';

import { useState, useCallback } from 'react';
import { downloadStore } from '@/lib/download-store';

export function useDownloadManager() {
  const [loading, setLoading] = useState(false);

  // Function to automatically trigger download
  const triggerDownload = (filename: string, title: string) => {
    const link = document.createElement('a');
    link.href = `/api/serve/${encodeURIComponent(filename)}`;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  // Fallback function to process URLs individually
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