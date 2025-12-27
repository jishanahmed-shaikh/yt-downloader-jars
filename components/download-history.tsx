'use client';

import { useEffect, useState } from 'react';
import { downloadStore } from '@/lib/download-store';
import { DownloadHistory } from '@/lib/types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(date: Date): string {
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    'day'
  );
}

export function DownloadHistory() {
  const [history, setHistory] = useState<DownloadHistory[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    downloadStore.loadHistory();
    const unsubscribe = downloadStore.subscribe(() => {
      setHistory(downloadStore.getHistory());
    });
    setHistory(downloadStore.getHistory());
    return unsubscribe;
  }, []);

  const filteredHistory = history.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          📥 Download History ({history.length})
        </h3>
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
          {/* Search Input */}
          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Search downloads..."
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700"
            />
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {filteredHistory.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                {searchTerm ? 'No downloads match your search' : 'No downloads yet'}
              </div>
            ) : (
              filteredHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <span className="text-lg">
                  {item.format === 'audio' ? '🎵' : '🎬'}
                </span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {item.title}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300">
                      {item.format.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatBytes(item.size)}</span>
                    <span>{formatDuration(item.duration)}</span>
                    <span>{formatDate(item.downloadedAt)}</span>
                  </div>
                </div>

                <a
                  href={`/api/serve/${item.filename}`}
                  download={item.filename}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  title="Download again"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              </div>
            )))}
          </div>
        </div>
      )}
    </div>
  );
}