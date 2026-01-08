'use client';

import { useState, useEffect } from 'react';
import { downloadStore } from '@/lib/download-store';
import { DownloadPreset } from '@/lib/types';

interface DownloadPresetsProps {
  onApplyPreset: (preset: DownloadPreset) => void;
  currentFormat: 'video' | 'audio';
  currentQuality: string;
  currentAutoDownload: boolean;
}

export function DownloadPresets({ 
  onApplyPreset, 
  currentFormat, 
  currentQuality, 
  currentAutoDownload 
}: DownloadPresetsProps) {
  const [presets, setPresets] = useState<DownloadPreset[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    const updatePresets = () => {
      setPresets(downloadStore.getPresets());
    };

    updatePresets();
    const unsubscribe = downloadStore.subscribe(updatePresets);
    return unsubscribe;
  }, []);

  const handleSavePreset = () => {
    if (presetName.trim()) {
      downloadStore.savePreset(presetName.trim(), currentFormat, currentQuality, currentAutoDownload);
      setPresetName('');
      setShowSaveForm(false);
    }
  };

  const handleDeletePreset = (id: string) => {
    if (confirm('Are you sure you want to delete this preset?')) {
      downloadStore.deletePreset(id);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            ⚡ Download Presets
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Save and reuse your favorite download configurations
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
          {/* Save Current Settings */}
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Current: {currentFormat.toUpperCase()} • {currentQuality === 'best' ? 'Best Quality' : `${currentQuality}p`} • Auto-download {currentAutoDownload ? 'ON' : 'OFF'}
              </span>
              <button
                onClick={() => setShowSaveForm(!showSaveForm)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                💾 Save as Preset
              </button>
            </div>
            
            {showSaveForm && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Preset name..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800"
                  onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                />
                <button
                  onClick={handleSavePreset}
                  disabled={!presetName.trim()}
                  className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveForm(false);
                    setPresetName('');
                  }}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Preset List */}
          <div className="space-y-2">
            {presets.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                No presets saved yet. Save your current settings to create your first preset!
              </div>
            ) : (
              presets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {preset.name}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300">
                        {preset.format.toUpperCase()}
                      </span>
                      {preset.quality !== 'best' && (
                        <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 rounded text-purple-600 dark:text-purple-300">
                          {preset.quality}p
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Quality: {preset.quality === 'best' ? 'Best Available' : `${preset.quality}p`} • 
                      Auto-download: {preset.autoDownload ? 'ON' : 'OFF'}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => onApplyPreset(preset)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}