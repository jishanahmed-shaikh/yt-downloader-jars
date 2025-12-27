'use client';

import { useState } from 'react';
import { downloadStore } from '@/lib/download-store';

export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all download history and queue?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const downloadSampleVideo = () => {
    // Add a sample YouTube video for testing
    const sampleUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Roll for testing
    navigator.clipboard.writeText(sampleUrl).then(() => {
      alert('Sample URL copied to clipboard! Paste it in the download field.');
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`mb-2 ${isOpen ? 'block' : 'hidden'}`}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-2 space-y-1">
          <button
            onClick={() => downloadStore.clearCompleted()}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            🧹 Clear Completed
          </button>
          <button
            onClick={downloadSampleVideo}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            🎬 Sample Video
          </button>
          <button
            onClick={() => {
              const stats = downloadStore.getStats();
              alert(`📊 Quick Stats:\n• Total Downloads: ${stats.totalDownloads}\n• Success Rate: ${stats.successRate}%\n• Today: ${stats.todayDownloads}`);
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            📊 Quick Stats
          </button>
          <button
            onClick={clearAllData}
            className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          >
            🗑️ Clear All Data
          </button>
        </div>
      </div>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-colors"
      >
        <svg className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
    </div>
  );
}