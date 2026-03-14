'use client';

import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { BatchInput } from '@/components/batch-input';
import { DownloadQueue } from '@/components/download-queue';
import { DownloadHistory } from '@/components/download-history';
import { DownloadStats } from '@/components/download-stats';
import { DownloadPresets } from '@/components/download-presets';
import { QuickActions } from '@/components/quick-actions';
import { ClipboardNotification } from '@/components/clipboard-notification';
import { useDownloadManager } from '@/lib/hooks/use-download-manager';
import { useClipboardMonitor } from '@/lib/hooks/use-clipboard-monitor';
import { useTouchGestures } from '@/lib/hooks/use-touch-gestures';
import { downloadStore } from '@/lib/download-store';

interface DownloadResponse {
  success: boolean;
  filename?: string;
  filepath?: string;
  size?: number;
  title?: string;
  duration?: number;
  videoId?: string;
  thumbnail?: string;
  error?: { code: string; message: string };
}

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

export default function Home() {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'video' | 'audio'>('video');
  const [quality, setQuality] = useState('best');
  const [result, setResult] = useState<DownloadResponse | null>(null);
  const [autoDownload, setAutoDownload] = useState(true);
  const [bandwidthLimit, setBandwidthLimit] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [urlValid, setUrlValid] = useState<boolean | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { loading, downloadSingle, downloadBatch } = useDownloadManager();
  const { clipboardUrl, showNotification, useClipboardUrl, dismissNotification } = useClipboardMonitor();

  const mainRef = useTouchGestures({
    onSwipeLeft: () => setFormat(format === 'video' ? 'audio' : 'video'),
    onSwipeRight: () => handleReset(),
    onSwipeUp: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    onDoubleTap: () => { if (url.trim() && !loading) handleDownload(); },
  });

  useEffect(() => {
    downloadStore.loadSettings();
    setAutoDownload(downloadStore.getAutoDownload());
    setBandwidthLimit(downloadStore.getBandwidthLimit());
    setAutoRefresh(downloadStore.getAutoRefresh());
    const unsubscribe = downloadStore.subscribe(() => {
      setAutoDownload(downloadStore.getAutoDownload());
      setBandwidthLimit(downloadStore.getBandwidthLimit());
      setAutoRefresh(downloadStore.getAutoRefresh());
    });
    return () => { unsubscribe(); };
  }, []);

  const handleDownload = async () => {
    if (!url.trim()) return;
    setResult(null);
    await downloadSingle(url.trim(), format, quality);
  };

  const handleBatchDownload = async (urls: string[], batchFormat: 'video' | 'audio', batchQuality: string) => {
    await downloadBatch(urls, batchFormat, batchQuality);
  };

  const handleReset = () => {
    setUrl('');
    setResult(null);
    setFormat('video');
    setQuality('best');
    setUrlValid(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'v':
            if (e.target === document.body) {
              e.preventDefault();
              navigator.clipboard.readText().then(text => {
                if (text.includes('youtube.com') || text.includes('youtu.be')) setUrl(text);
              }).catch(() => {});
            }
            break;
          case 'Enter':
            if (!loading && url.trim()) { e.preventDefault(); handleDownload(); }
            break;
          case 'r':
            e.preventDefault(); handleReset(); break;
          case 'b':
            e.preventDefault();
            (document.querySelector('[data-batch-input]') as HTMLElement)?.click();
            break;
          case 'h':
            e.preventDefault();
            (document.querySelector('[data-history]') as HTMLElement)?.click();
            break;
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [loading, url, handleDownload]);

  useEffect(() => {
    (document.querySelector('input[type="text"]') as HTMLInputElement)?.focus();
  }, []);

  return (
    <main ref={mainRef} className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <ThemeToggle />

      <div className="container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                YT Downloader
              </h1>
              <span className="text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                v2.1
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Download YouTube videos, audio and playlists
            </p>
            <div className="flex justify-center gap-3 mt-3 text-xs text-gray-400 dark:text-gray-500">
              <span>Videos &amp; Shorts</span>
              <span>·</span>
              <span>MP3 Audio</span>
              <span>·</span>
              <span>Batch &amp; Playlists</span>
              <span>·</span>
              <span>Up to 2 hrs</span>
            </div>
          </div>

          {/* Settings Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-4">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full px-5 py-3 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <span className="font-medium">Settings</span>
              <svg className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showSettings && (
              <div className="px-5 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Auto-download on complete</span>
                  <button
                    onClick={() => downloadStore.setAutoDownload(!autoDownload)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoDownload ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow ${autoDownload ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Auto-refresh queue</span>
                  <button
                    onClick={() => downloadStore.setAutoRefresh(!autoRefresh)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoRefresh ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow ${autoRefresh ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Speed limit</span>
                  <select
                    value={bandwidthLimit}
                    onChange={(e) => downloadStore.setBandwidthLimit(Number(e.target.value))}
                    className="text-sm px-2 py-1 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value={0}>Unlimited</option>
                    <option value={100}>100 KB/s</option>
                    <option value={500}>500 KB/s</option>
                    <option value={1000}>1 MB/s</option>
                    <option value={5000}>5 MB/s</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Presets */}
          <DownloadPresets
            onApplyPreset={(preset) => {
              setFormat(preset.format);
              setQuality(preset.quality);
              downloadStore.setAutoDownload(preset.autoDownload);
            }}
            currentFormat={format}
            currentQuality={quality}
            currentAutoDownload={autoDownload}
          />

          {/* Batch Download */}
          <div data-batch-input>
            <BatchInput onBatchSubmit={handleBatchDownload} loading={loading} />
          </div>

          {/* Queue */}
          <DownloadQueue />

          {/* Single Download Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
              Quick Download
            </h2>

            {/* Format Toggle */}
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-600 p-0.5 bg-gray-50 dark:bg-gray-700/50">
                <button
                  onClick={() => setFormat('video')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    format === 'video' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  Video
                </button>
                <button
                  onClick={() => setFormat('audio')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    format === 'audio' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  Audio
                </button>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {format === 'video' ? 'MP4' : 'MP3'}
              </span>
            </div>

            {/* Quality */}
            {format === 'video' && (
              <div className="mb-4">
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700"
                >
                  <option value="best">Best Quality</option>
                  <option value="2160">4K (2160p)</option>
                  <option value="1440">2K (1440p)</option>
                  <option value="1080">Full HD (1080p)</option>
                  <option value="720">HD (720p)</option>
                  <option value="480">SD (480p)</option>
                  <option value="360">Low (360p)</option>
                  <option value="worst">Fastest (Lowest)</option>
                </select>
              </div>
            )}

            {/* URL Input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    const v = e.target.value;
                    setUrl(v);
                    setUrlValid(v.trim() ? (v.includes('youtube.com') || v.includes('youtu.be')) : null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleDownload()}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 pr-8 ${
                    urlValid === false ? 'border-red-300 dark:border-red-600' : urlValid === true ? 'border-green-300 dark:border-green-600' : 'border-gray-200 dark:border-gray-600'
                  }`}
                  disabled={loading}
                />
                {urlValid !== null && (
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold ${urlValid ? 'text-green-500' : 'text-red-400'}`}>
                    {urlValid ? '✓' : '✗'}
                  </span>
                )}
              </div>
              <button
                onClick={handleDownload}
                disabled={loading || !url.trim() || urlValid === false}
                className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing
                  </>
                ) : 'Download'}
              </button>
            </div>

            {(url || result) && !loading && (
              <button
                onClick={handleReset}
                className="mt-3 w-full py-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Clear &amp; reset
              </button>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-xl border p-5 mb-4 ${result.success ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
              {result.success ? (
                <div className="flex items-start gap-4">
                  {result.thumbnail && (
                    <img src={result.thumbnail} alt={result.title} className="w-24 h-16 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate mb-1">{result.title}</p>
                    <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <span>{formatDuration(result.duration || 0)}</span>
                      <span>·</span>
                      <span>{formatBytes(result.size || 0)}</span>
                      <span>·</span>
                      <span>{result.filename?.endsWith('.mp3') ? 'MP3' : 'MP4'}</span>
                    </div>
                    <a
                      href={`/api/serve/${result.filename}`}
                      download={result.filename}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Save to device
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">{result.error?.code}</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{result.error?.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stats & History */}
          <DownloadStats />
          <div data-history><DownloadHistory /></div>

          {/* Footer */}
          <div className="text-center mt-8 pb-4 space-y-2">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Internal tool · YouTube videos, Shorts &amp; playlists
            </p>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
              <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+V</kbd> paste</span>
              <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+Enter</kbd> download</span>
              <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+R</kbd> reset</span>
              <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+B</kbd> batch</span>
            </div>
          </div>

        </div>
      </div>

      {showNotification && clipboardUrl && (
        <ClipboardNotification
          url={clipboardUrl}
          onUse={() => { const u = useClipboardUrl(); if (u) setUrl(u); }}
          onDismiss={dismissNotification}
        />
      )}

      <QuickActions />
    </main>
  );
}
