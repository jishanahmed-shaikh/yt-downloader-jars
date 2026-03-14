'use client';

import { useEffect, useState } from 'react';
import { downloadStore } from '@/lib/download-store';
import { type DownloadStats } from '@/lib/types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function DownloadStats() {
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const update = () => setStats(downloadStore.getStats());
    update();
    const unsubscribe = downloadStore.subscribe(update);
    return unsubscribe;
  }, []);

  if (!stats || stats.totalDownloads === 0) return null;

  const statItems = [
    { label: 'Total', value: stats.totalDownloads.toString(), color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Data', value: formatBytes(stats.totalDataDownloaded), color: 'text-green-600 dark:text-green-400' },
    { label: 'Avg size', value: formatBytes(stats.averageFileSize), color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Today', value: stats.todayDownloads.toString(), color: 'text-orange-600 dark:text-orange-400' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Statistics</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {stats.totalDownloads} downloads · {formatBytes(stats.totalDataDownloaded)}
          </span>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
          <div className="grid grid-cols-4 gap-3">
            {statItems.map(({ label, value, color }) => (
              <div key={label} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className={`text-lg font-bold ${color}`}>{value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
            <span>Top format: <span className="font-medium text-gray-700 dark:text-gray-300">{stats.mostDownloadedFormat}</span></span>
            <span>Success rate: <span className="font-medium text-green-600 dark:text-green-400">{stats.successRate}%</span></span>
          </div>
        </div>
      )}
    </div>
  );
}
