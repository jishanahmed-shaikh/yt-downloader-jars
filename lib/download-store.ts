'use client';

import { DownloadItem, DownloadHistory } from './types';

class DownloadStore {
  private queue: DownloadItem[] = [];
  private history: DownloadHistory[] = [];
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  addToQueue(url: string, format: 'video' | 'audio'): string {
    const id = Math.random().toString(36).substr(2, 9);
    const item: DownloadItem = {
      id,
      url,
      format,
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
      item.progress = progress;
      this.notify();
    }
  }

  updateStatus(id: string, status: DownloadItem['status'], data?: Partial<DownloadItem>) {
    const item = this.queue.find(i => i.id === id);
    if (item) {
      item.status = status;
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