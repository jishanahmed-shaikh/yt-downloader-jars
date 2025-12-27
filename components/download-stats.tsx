'use client';

import { useEffect, useState } from 'react';
import { downloadStore } from '@/lib/download-store';
import { DownloadStats } from '@/lib/types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function DownloadStats() {
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      setStats(downloadStore.getStats());
    };

    updateStats();
    const unsubscribe = downloadStore.subscribe(updateStats);
    return unsubscribe;
  }, []);

  if (!stats || stats.totalDownloads === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            📊 Download Statistics
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {stats.totalDownloads} downloads • {formatBytes(stats.totalDataDownloaded)} total
          </p>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalDownloads}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">
                Total Downloads
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatBytes(stats.totalDataDownloaded)}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">
                Data Downloaded
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatBytes(stats.averageFileSize)}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">
                Average Size
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.todayDownloads}
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400">
                Today's Downloads
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              Most downloaded format: 
              <span className="ml-1 font-medium">
                {stats.mostDownloadedFormat === 'video' ? '🎬 Video' : '🎵 Audio'}
              </span>
            </span>
            <span>
              Success rate: 
              <span className="ml-1 font-medium text-green-600 dark:text-green-400">
                {stats.successRate}%
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}