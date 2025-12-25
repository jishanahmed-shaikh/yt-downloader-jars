'use client';

import { useState } from 'react';

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
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DownloadResponse | null>(null);

  const handleDownload = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), format }),
      });

      const data: DownloadResponse = await response.json();
      setResult(data);
    } catch {
      setResult({
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'Failed to connect to server' },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleDownload();
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            YouTube Downloader
          </h1>
          <p className="text-gray-500">
            Paste a YouTube URL to download video or audio
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {/* Format Toggle */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setFormat('video')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  format === 'video'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🎬 Video (MP4)
              </button>
              <button
                onClick={() => setFormat('audio')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  format === 'audio'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-600 hover:text-gray-800'
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
              onKeyPress={handleKeyPress}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-700"
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
        </div>

        {result && (
          <div className={`rounded-xl shadow-lg p-6 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
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
                    <h3 className="font-semibold text-gray-800 mb-1">{result.title}</h3>
                    <div className="text-sm text-gray-500 space-y-1">
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
                <details className="mt-4">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                    View JSON Response
                  </summary>
                  <pre className="mt-2 p-3 bg-white rounded-lg text-xs overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Error: {result.error?.code}</span>
                </div>
                <p className="text-red-600">{result.error?.message}</p>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          Internal tool for testing purposes only. Supports YouTube videos and Shorts.
        </p>
      </div>
    </main>
  );
}
