'use client';

import { useEffect, useState } from 'react';
import { downloadStore } from '@/lib/download-store';
import { DownloadItem } from '@/lib/types';
import { useDownloadManager } from '@/lib/hooks/use-download-manager';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
  return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatETA(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getStatusIcon(status: DownloadItem['status']) {
  switch (status) {
    case 'pending': return '⏳';
    case 'downloading': return '⬇️';
    case 'completed': return '✅';
    case 'error': return '❌';
    default: return '⏳';
  }
}

function getStatusColor(status: DownloadItem['status']) {
  switch (status) {
    case 'pending': return 'text-yellow-600 dark:text-yellow-400';
    case 'downloading': return 'text-blue-600 dark:text-blue-400';
    case 'completed': return 'text-green-600 dark:text-green-400';
    case 'error': return 'text-red-600 dark:text-red-400';
    default: return 'text-gray-600 dark:text-gray-400';
  }
}

export function DownloadQueue() {
  const [queue, setQueue] = useState<DownloadItem[]>([]);
  const { processPendingDownloads } = useDownloadManager();

  useEffect(() => {
    const unsubscribe = downloadStore.subscribe(() => {
      setQueue(downloadStore.getQueue());
    });
    setQueue(downloadStore.getQueue());
    return unsubscribe;
  }, []);

  if (queue.length === 0) {
    return null;
  }

  const pendingCount = queue.filter(item => item.status === 'pending').length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Download Queue ({queue.length})
        </h3>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <button
              onClick={processPendingDownloads}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Process {pendingCount} Pending
            </button>
          )}
          <button
            onClick={() => downloadStore.clearCompleted()}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear Completed
          </button>
          <button
            onClick={() => {
              if (confirm('Clear entire queue? This will remove all items.')) {
                queue.forEach(item => downloadStore.removeFromQueue(item.id));
              }
            }}
            className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {queue.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <span className="text-lg">{getStatusIcon(item.status)}</span>
            
            <div className="flex-1 min-w-0">
              {item.status === 'pending' && !item.title ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  {item.title || 'Processing...'}
                </span>
                <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300">
                  {item.format.toUpperCase()}
                </span>
                {item.quality && item.quality !== 'best' && (
                  <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 rounded text-purple-600 dark:text-purple-300">
                    {item.quality === 'worst' ? 'FAST' : `${item.quality}P`}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-xs ${getStatusColor(item.status)}`}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  • {formatTimeAgo(item.createdAt)}
                </span>
                {item.size && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    • {formatBytes(item.size)}
                  </span>
                )}
                {item.status === 'completed' && item.filename && (
                  <div className="flex gap-2">
                    <a
                      href={`/api/serve/${encodeURIComponent(item.filename)}`}
                      download={item.filename}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={(e) => {
                        // Also trigger programmatic download
                        e.preventDefault();
                        const link = document.createElement('a');
                        link.href = `/api/serve/${encodeURIComponent(item.filename)}`;
                        link.download = item.filename;
                        link.click();
                      }}
                    >
                      📥 Download
                    </a>
                    <button
                      onClick={() => {
                        const downloadUrl = `${window.location.origin}/api/serve/${encodeURIComponent(item.filename)}`;
                        navigator.clipboard.writeText(downloadUrl).then(() => {
                          // Show temporary feedback
                          const button = document.activeElement as HTMLButtonElement;
                          const originalText = button.textContent;
                          button.textContent = '✅ Copied!';
                          setTimeout(() => {
                            button.textContent = originalText;
                          }, 2000);
                        });
                      }}
                      className="text-xs text-green-600 dark:text-green-400 hover:underline"
                    >
                      🔗 Copy Link
                    </button>
                  </div>
                )}
                {item.status === 'error' && (
                  <button
                    onClick={() => {
                      // Retry download
                      downloadStore.updateStatus(item.id, 'pending');
                    }}
                    className="text-xs text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    🔄 Retry
                  </button>
                )}
              </div>

              {item.status === 'downloading' && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item.progress}%
                    </span>
                    <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                      {item.downloadSpeed && (
                        <span>{formatSpeed(item.downloadSpeed)}</span>
                      )}
                      {item.eta && (
                        <span>ETA: {formatETA(item.eta)}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {item.status === 'error' && item.error && (
                <div className="text-xs text-red-600 dark:text-red-400 mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  ⚠️ {item.error}
                </div>
              )}
            </div>

            <button
              onClick={() => downloadStore.removeFromQueue(item.id)}
              className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}