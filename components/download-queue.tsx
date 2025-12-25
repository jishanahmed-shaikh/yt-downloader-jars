'use client';

import { useEffect, useState } from 'react';
import { downloadStore } from '@/lib/download-store';
import { DownloadItem } from '@/lib/types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Download Queue ({queue.length})
        </h3>
        <button
          onClick={() => downloadStore.clearCompleted()}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Clear Completed
        </button>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {queue.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <span className="text-lg">{getStatusIcon(item.status)}</span>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  {item.title || 'Processing...'}
                </span>
                <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300">
                  {item.format.toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-xs ${getStatusColor(item.status)}`}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
                {item.size && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatBytes(item.size)}
                  </span>
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
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {item.progress}%
                  </span>
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