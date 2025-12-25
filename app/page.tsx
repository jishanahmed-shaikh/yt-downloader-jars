'use client';

import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { BatchInput } from '@/components/batch-input';
import { DownloadQueue } from '@/components/download-queue';
import { DownloadHistory } from '@/components/download-history';
import { useDownloadManager } from '@/lib/hooks/use-download-manager';

interface DownloadResponse {
  success: boolean;
  filename?: string;
  filepath?: string;
  size?: number;
  title?: string;
  duration?: number;
  videoId?: string;
  thumbnail?: string;
  error?: {
    code: string;
    message: string;
  };
}

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

export default function Home() {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'video' | 'audio'>('video');
  const [result, setResult] = useState<DownloadResponse | null>(null);
  const { loading, downloadSingle, downloadBatch } = useDownloadManager();

  const handleDownload = async () => {
    if (!url.trim()) return;
    setResult(null);
    await downloadSingle(url.trim(), format);
  };

  const handleBatchDownload = async (urls: string[], batchFormat: 'video' | 'audio') => {
    await downloadBatch(urls, batchFormat);
  };

  const handleReset = () => {
    setUrl('');
    setResult(null);
    setFormat('video');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'v':
            if (e.target === document.body) {
              e.preventDefault();
              navigator.clipboard.readText().then(text => {
                if (text.includes('youtube.com') || text.includes('youtu.be')) {
                  setUrl(text);
                }
              }).catch(() => {
                // Clipboard access denied, ignore
              });
            }
            break;
          case 'Enter':
            if (!loading && url.trim()) {
              e.preventDefault();
              handleDownload();
            }
            break;
          case 'r':
            e.preventDefault();
            handleReset();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [loading, url, handleDownload]);

  // Auto-focus input on mount
  useEffect(() => {
    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (input) {
      input.focus();
    }
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <ThemeToggle />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              🎬 YouTube Downloader
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Download videos, audio, playlists, and manage your downloads
            </p>
            <div className="flex justify-center gap-4 text-sm text-gray-400 dark:text-gray-500">
              <span>✅ Videos & Shorts</span>
              <span>✅ Audio Extraction</span>
              <span>✅ Batch Downloads</span>
              <span>✅ Playlist Support</span>
            </div>
          </div>

          {/* Batch Download */}
          <BatchInput onBatchSubmit={handleBatchDownload} loading={loading} />

          {/* Download Queue */}
          <DownloadQueue />

          {/* Single Download */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              🎯 Quick Download
            </h3>
            
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

            {/* URL Input */}
            <div className="flex gap-3">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleDownload()}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700"
                disabled={loading}
              />
              <button
                onClick={handleDownload}
                disabled={loading || !url.trim()}
                className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing
                  </span>
                ) : (
                  'Download'
                )}
              </button>
            </div>

            {/* Reset Button */}
            {(url || result) && !loading && (
              <button
                onClick={handleReset}
                className="mt-3 w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                🔄 Reset & Download Another
              </button>
            )}
          </div>

          {/* Single Download Result */}
          {result && (
            <div className={`rounded-xl shadow-lg p-6 mb-6 ${result.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
              {result.success ? (
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    {result.thumbnail && (
                      <img
                        src={result.thumbnail}
                        alt={result.title}
                        className="w-32 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{result.title}</h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                        <p>Duration: {formatDuration(result.duration || 0)}</p>
                        <p>Size: {formatBytes(result.size || 0)}</p>
                        <p>Format: {result.filename?.endsWith('.mp3') ? '🎵 MP3 Audio' : '🎬 MP4 Video'}</p>
                      </div>
                    </div>
                  </div>
                  <a
                    href={`/api/serve/${result.filename}`}
                    download={result.filename}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download to Device
                  </a>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Error: {result.error?.code}</span>
                  </div>
                  <p className="text-red-600 dark:text-red-400">{result.error?.message}</p>
                </div>
              )}
            </div>
          )}

          {/* Download History */}
          <DownloadHistory />

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8 space-y-2">
            <p>Internal tool for testing purposes only. Supports YouTube videos, Shorts, and playlists.</p>
            <p>
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+V</kbd> Auto-paste URL •{' '}
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+Enter</kbd> Download •{' '}
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+R</kbd> Reset
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}