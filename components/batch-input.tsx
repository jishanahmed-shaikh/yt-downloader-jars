'use client';

import { useState } from 'react';

interface BatchInputProps {
  onBatchSubmit: (urls: string[], format: 'video' | 'audio', quality: string) => void;
  loading: boolean;
}

export function BatchInput({ onBatchSubmit, loading }: BatchInputProps) {
  const [batchText, setBatchText] = useState('');
  const [format, setFormat] = useState<'video' | 'audio'>('video');
  const [quality, setQuality] = useState('best');
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleSubmit = () => {
    const urls = batchText.split('\n').map(u => u.trim()).filter(Boolean);
    if (urls.length > 0) {
      onBatchSubmit(urls, format, quality);
      setBatchText('');
      setIsOpen(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const text = e.dataTransfer.getData('text');
    if (text) {
      const urls = text.split('\n').map(u => u.trim()).filter(Boolean);
      if (urls.length) { setBatchText(p => p ? `${p}\n${urls.join('\n')}` : urls.join('\n')); setIsOpen(true); }
    } else {
      Array.from(e.dataTransfer.files).forEach(file => {
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          const reader = new FileReader();
          reader.onload = ev => {
            const content = ev.target?.result as string;
            if (content) {
              const urls = content.split('\n').map(u => u.trim()).filter(Boolean);
              if (urls.length) { setBatchText(p => p ? `${p}\n${urls.join('\n')}` : urls.join('\n')); setIsOpen(true); }
            }
          };
          reader.readAsText(file);
        }
      });
    }
  };

  const urlCount = batchText.split('\n').filter(u => u.trim().length > 0).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
      >
        <div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Batch Download</span>
          <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">up to 10 URLs</span>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
          {/* Format + Quality row */}
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-600 p-0.5 bg-gray-50 dark:bg-gray-700/50">
              <button
                onClick={() => setFormat('video')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${format === 'video' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >Video</button>
              <button
                onClick={() => setFormat('audio')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${format === 'audio' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >Audio</button>
            </div>
            {format === 'video' && (
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="best">Best</option>
                <option value="1080">1080p</option>
                <option value="720">720p</option>
                <option value="480">480p</option>
                <option value="360">360p</option>
                <option value="worst">Fastest</option>
              </select>
            )}
          </div>

          {/* Textarea */}
          <div
            className={`relative rounded-lg transition-all ${isDragging ? 'ring-2 ring-red-400' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={handleDrop}
          >
            <textarea
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder={"Paste YouTube URLs here, one per line\nhttps://www.youtube.com/watch?v=...\nhttps://youtu.be/..."}
              className="w-full h-28 px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 resize-none"
              disabled={loading}
            />
            {isDragging && (
              <div className="absolute inset-0 bg-red-50 dark:bg-red-900/20 border-2 border-dashed border-red-400 rounded-lg flex items-center justify-center">
                <span className="text-sm text-red-600 dark:text-red-400 font-medium">Drop URLs or text files here</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {urlCount} URL{urlCount !== 1 ? 's' : ''}
              {urlCount > 10 && <span className="text-red-500 ml-1">(max 10)</span>}
            </span>
            <button
              onClick={handleSubmit}
              disabled={loading || urlCount === 0 || urlCount > 10}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Processing...' : `Download ${urlCount > 0 ? urlCount : ''} item${urlCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
