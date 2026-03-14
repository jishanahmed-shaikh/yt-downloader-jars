'use client';

import { useEffect, useState } from 'react';
import { downloadStore } from '@/lib/download-store';
import { type DownloadHistory } from '@/lib/types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
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
    const unsubscribe = downloadStore.subscribe(() => setHistory(downloadStore.getHistory()));
    setHistory(downloadStore.getHistory());
    return unsubscribe;
  }, []);

  const filtered = history.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportHistory = (fmt: 'csv' | 'json') => {
    let content: string, type: string, ext: string;
    if (fmt === 'csv') {
      content = ['Title,URL,Format,Filename,Size (MB),Duration,Downloaded At',
        ...filtered.map(i => `"${i.title}","${i.url}","${i.format}","${i.filename}",${(i.size / 1024 / 1024).toFixed(2)},${i.duration},"${i.downloadedAt.toISOString()}"`)
      ].join('\n');
      type = 'text/csv'; ext = 'csv';
    } else {
      content = JSON.stringify(filtered, null, 2);
      type = 'application/json'; ext = 'json';
    }
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `history-${new Date().toISOString().split('T')[0]}.${ext}`; a.click();
    URL.revokeObjectURL(url);
  };

  if (history.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-4">
      <button
        data-history
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">History</span>
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{history.length}</span>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          <div className="px-5 py-3 flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700"
            />
            <button onClick={() => exportHistory('csv')} className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">CSV</button>
            <button onClick={() => exportHistory('json')} className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">JSON</button>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-gray-700/50 max-h-72 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-6">
                {searchTerm ? 'No results found' : 'No downloads yet'}
              </p>
            ) : filtered.map((item) => (
              <div key={item.id} className="px-5 py-3 flex items-center gap-3">
                <span className="text-base flex-shrink-0">{item.format === 'audio' ? '🎵' : '🎬'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{item.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    <span className="uppercase">{item.format}</span>
                    <span>·</span>
                    <span>{formatBytes(item.size)}</span>
                    <span>·</span>
                    <span>{formatDuration(item.duration)}</span>
                    <span>·</span>
                    <span>{formatDate(item.downloadedAt)}</span>
                  </div>
                </div>
                <a
                  href={`/api/serve/${item.filename}`}
                  download={item.filename}
                  className="flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="Download again"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
