'use client';

import { DownloadItem, DownloadHistory, DownloadStats } from './types';

class DownloadStore {
  private queue: DownloadItem[] = [];
  private history: DownloadHistory[] = [];
  private listeners: Set<() => void> = new Set();
  private autoDownload: boolean = true; // Default to auto-download enabled
  private bandwidthLimit: number = 0; // 0 = unlimited, otherwise KB/s

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  setAutoDownload(enabled: boolean) {
    this.autoDownload = enabled;
    localStorage.setItem('auto-download', JSON.stringify(enabled));
    this.notify();
  }

  getAutoDownload(): boolean {
    return this.autoDownload;
  }

  setBandwidthLimit(limitKBps: number) {
    this.bandwidthLimit = limitKBps;
    localStorage.setItem('bandwidth-limit', JSON.stringify(limitKBps));
    this.notify();
  }

  getBandwidthLimit(): number {
    return this.bandwidthLimit;
  }

  loadSettings() {
    try {
      const autoDownloadSetting = localStorage.getItem('auto-download');
      if (autoDownloadSetting !== null) {
        this.autoDownload = JSON.parse(autoDownloadSetting);
      }
      
      const bandwidthSetting = localStorage.getItem('bandwidth-limit');
      if (bandwidthSetting !== null) {
        this.bandwidthLimit = JSON.parse(bandwidthSetting);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  addToQueue(url: string, format: 'video' | 'audio', quality?: string): string {
    // Check for duplicates in queue
    const existingInQueue = this.queue.find(item => 
      item.url === url && item.format === format && item.quality === quality
    );
    
    if (existingInQueue) {
      // Return existing ID instead of creating duplicate
      return existingInQueue.id;
    }
    
    // Check for duplicates in recent history (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentDuplicate = this.history.find(item =>
      item.url === url && item.format === format && item.downloadedAt > oneDayAgo
    );
    
    if (recentDuplicate) {
      // Show notification about duplicate
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Duplicate Download Detected! 🔄', {
          body: `"${recentDuplicate.title}" was downloaded recently`,
          icon: '/favicon.ico',
          tag: 'duplicate-download'
        });
      }
    }
    
    const id = Math.random().toString(36).substr(2, 9);
    const item: DownloadItem = {
      id,
      url,
      format,
      quality,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    };
    this.queue.push(item);
    this.notify();
    return id;
  }

  updateProgress(id: string, progress: number) {
    const item = this.queue.find(i => i.id === id);
    if (item) {
      const now = new Date();
      item.progress = progress;
      
      // Calculate download speed and ETA
      if (item.startTime && item.size) {
        const elapsedSeconds = (now.getTime() - item.startTime.getTime()) / 1000;
        const downloadedBytes = (progress / 100) * item.size;
        item.downloadSpeed = downloadedBytes / elapsedSeconds;
        
        if (progress > 0 && progress < 100) {
          const remainingBytes = item.size - downloadedBytes;
          item.eta = remainingBytes / item.downloadSpeed;
        }
      }
      
      this.notify();
    }
  }

  updateStatus(id: string, status: DownloadItem['status'], data?: Partial<DownloadItem>) {
    const item = this.queue.find(i => i.id === id);
    if (item) {
      item.status = status;
      
      // Set start time when download begins
      if (status === 'downloading' && !item.startTime) {
        item.startTime = new Date();
      }
      
      if (data) {
        Object.assign(item, data);
      }
      this.notify();
    }
  }

  completeDownload(id: string, result: any) {
    const item = this.queue.find(i => i.id === id);
    if (item && result.success) {
      // Add to history
      const historyItem: DownloadHistory = {
        id: Math.random().toString(36).substr(2, 9),
        title: result.title,
        url: item.url,
        format: item.format,
        filename: result.filename,
        size: result.size,
        duration: result.duration,
        downloadedAt: new Date(),
      };
      this.history.unshift(historyItem);
      
      // Keep only last 50 items
      if (this.history.length > 50) {
        this.history = this.history.slice(0, 50);
      }
      
      // Save to localStorage
      localStorage.setItem('download-history', JSON.stringify(this.history));
    }
    this.notify();
  }

  removeFromQueue(id: string) {
    this.queue = this.queue.filter(item => item.id !== id);
    this.notify();
  }

  clearCompleted() {
    this.queue = this.queue.filter(item => item.status !== 'completed');
    this.notify();
  }

  getQueue(): DownloadItem[] {
    return [...this.queue];
  }

  getHistory(): DownloadHistory[] {
    return [...this.history];
  }

  getStats(): DownloadStats {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const totalDownloads = this.history.length;
    const totalDataDownloaded = this.history.reduce((sum, item) => sum + item.size, 0);
    const todayDownloads = this.history.filter(item => 
      item.downloadedAt >= today
    ).length;
    
    const videoDownloads = this.history.filter(item => item.format === 'video').length;
    const audioDownloads = this.history.filter(item => item.format === 'audio').length;
    
    return {
      totalDownloads,
      totalDataDownloaded,
      successRate: 100, // We only store successful downloads in history
      averageFileSize: totalDownloads > 0 ? totalDataDownloaded / totalDownloads : 0,
      mostDownloadedFormat: videoDownloads >= audioDownloads ? 'video' : 'audio',
      todayDownloads,
    };
  }

  loadHistory() {
    try {
      const stored = localStorage.getItem('download-history');
      if (stored) {
        this.history = JSON.parse(stored).map((item: any) => ({
          ...item,
          downloadedAt: new Date(item.downloadedAt),
        }));
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }
}

export const downloadStore = new DownloadStore();