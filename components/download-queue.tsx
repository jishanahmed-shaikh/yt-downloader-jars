'use client';

import { useEffect, useState } from 'react';
import { downloadStore } from '@/lib/download-store';
import { DownloadItem } from '@/lib/types';
import { useDownloadManager } from '@/lib/hooks/use-download-manager';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatSpeed(bps: number): string {
  if (bps === 0) return '';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s'];
  const i = Math.floor(Math.log(bps) / Math.log(k));
  return parseFloat((bps / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatETA(s: number): string {
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return `${Math.round(s / 3600)}h`;
}

function formatTimeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const statusColors: Record<DownloadItem['status'], string> = {
  pending: 'text-amber-600 dark:text-amber-400',
  downloading: 'text-blue-600 dark:text-blue-400',
  completed: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
};

const statusDot: Record<DownloadItem['status'], string> = {
  pending: 'bg-amber-400',
  downloading: 'bg-blue-500 animate-pulse',
  completed: 'bg-green-500',
  error: 'bg-red-500',
};

export function DownloadQueue() {
  const [queue, setQueue] = useState<DownloadItem[]>([]);
  const { processPendingDownloads } = useDownloadManager();

  useEffect(() => {
    const unsubscribe = downloadStore.subscribe(() => setQueue(downloadStore.getQueue()));
    setQueue(downloadStore.getQueue());
    return unsubscribe;
  }, []);

  if (queue.length === 0) return null;

  const counts = {
    pending: queue.filter(i => i.status === 'pending').length,
    downloading: queue.filter(i => i.status === 'downloading').length,
    completed: queue.filter(i => i.status === 'completed').length,
    error: queue.filter(i => i.status === 'error').length,
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-4">
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Queue</h2>
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{queue.length}</span>
          {counts.downloading > 0 && <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">{counts.downloading} active</span>}
          {counts.error > 0 && <span className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">{counts.error} failed</span>}
        </div>
        <div className="flex items-center gap-3">
          {counts.pending > 0 && (
            <button onClick={processPendingDownloads} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Process {counts.pending}
            </button>
          )}
          {counts.completed > 0 && (
            <button onClick={() => downloadStore.clearCompleted()} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              Clear done
            </button>
          )}
          <button
            onClick={() => { if (confirm('Remove all items from queue?')) queue.forEach(i => downloadStore.removeFromQueue(i.id)); }}
            className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-50 dark:divide-gray-700/50 max-h-72 overflow-y-auto">
        {queue.map((item) => (
          <div key={item.id} className="px-5 py-3 flex items-start gap-3">
            <div className="mt-1.5 flex-shrink-0">
              <span className={`block w-2 h-2 rounded-full ${statusDot[item.status]}`} />
            </div>

            <div className="flex-1 min-w-0">
              {item.status === 'pending' && !item.title ? (
                <div className="animate-pulse space-y-1.5">
                  <div className="h-3.5 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/3" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-sm text-gray-800 dark:text-gray-200 truncate font-medium">{item.title || 'Processing...'}</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">{item.format.toUpperCase()}</span>
                    {item.quality && item.quality !== 'best' && (
                      <span className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded">
                        {item.quality === 'worst' ? 'fast' : `${item.quality}p`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                    <span className={statusColors[item.status]}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>
                    <span>·</span>
                    <span>{formatTimeAgo(item.createdAt)}</span>
                    {item.size && <><span>·</span><span>{formatBytes(item.size)}</span></>}
                    {item.status === 'completed' && item.filename && (
                      <>
                        <span>·</span>
                        <a
                          href={`/api/serve/${encodeURIComponent(item.filename)}`}
                          download={item.filename}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                          onClick={(e) => {
                            e.preventDefault();
                            if (item.filename) {
                              const link = document.createElement('a');
                              link.href = `/api/serve/${encodeURIComponent(item.filename)}`;
                              link.download = item.filename;
                              link.click();
                            }
                          }}
                        >Download</a>
                        <span>·</span>
                        <button
                          className="hover:text-gray-600 dark:hover:text-gray-300"
                          onClick={() => { if (item.filename) navigator.clipboard.writeText(`${window.location.origin}/api/serve/${encodeURIComponent(item.filename)}`); }}
                        >Copy link</button>
                      </>
                    )}
                    {item.status === 'error' && (
                      <><span>·</span><button onClick={() => downloadStore.updateStatus(item.id, 'pending')} className="text-orange-500 hover:underline">Retry</button></>
                    )}
                  </div>

                  {item.status === 'downloading' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-400 dark:text-gray-500">
                        <span>{item.progress}%</span>
                        <span>{item.downloadSpeed ? formatSpeed(item.downloadSpeed) : ''}{item.eta ? ` · ${formatETA(item.eta)} left` : ''}</span>
                      </div>
                    </div>
                  )}

                  {item.status === 'error' && item.error && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">{item.error}</p>
                  )}
                </>
              )}
            </div>

            <button onClick={() => downloadStore.removeFromQueue(item.id)} className="flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors mt-0.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
