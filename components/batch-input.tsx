'use client';

import { useState } from 'react';

interface BatchInputProps {
  onBatchSubmit: (urls: string[], format: 'video' | 'audio') => void;
  loading: boolean;
}

export function BatchInput({ onBatchSubmit, loading }: BatchInputProps) {
  const [batchText, setBatchText] = useState('');
  const [format, setFormat] = useState<'video' | 'audio'>('video');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    const urls = batchText
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);
    
    if (urls.length > 0) {
      onBatchSubmit(urls, format);
      setBatchText('');
      setIsOpen(false);
    }
  };

  const urlCount = batchText.split('\n').filter(url => url.trim().length > 0).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            📋 Batch Download
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Download multiple videos or playlists at once
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
          {/* Format Toggle */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-600 p-1">
              <button
                onClick={() => setFormat('video')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  format === 'video'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                🎬 Video (MP4)
              </button>
              <button
                onClick={() => setFormat('audio')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  format === 'audio'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                🎵 Audio (MP3)
              </button>
            </div>
          </div>

          {/* Batch Input */}
          <textarea
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            placeholder="Paste YouTube URLs here (one per line)&#10;&#10;Examples:&#10;https://www.youtube.com/watch?v=...&#10;https://www.youtube.com/playlist?list=...&#10;https://youtu.be/..."
            className="w-full h-32 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 resize-none"
            disabled={loading}
          />

          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {urlCount} URL{urlCount !== 1 ? 's' : ''} ready
              {urlCount > 10 && (
                <span className="text-red-500 ml-2">
                  (Max 10 allowed)
                </span>
              )}
            </span>
            
            <button
              onClick={handleSubmit}
              disabled={loading || urlCount === 0 || urlCount > 10}
              className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : `Download ${urlCount} Item${urlCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}