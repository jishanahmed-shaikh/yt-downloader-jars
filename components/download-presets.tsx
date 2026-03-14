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

export function DownloadPresets({ onApplyPreset, currentFormat, currentQuality, currentAutoDownload }: DownloadPresetsProps) {
  const [presets, setPresets] = useState<DownloadPreset[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    const update = () => setPresets(downloadStore.getPresets());
    update();
    const unsubscribe = downloadStore.subscribe(update);
    return unsubscribe;
  }, []);

  const handleSave = () => {
    if (presetName.trim()) {
      downloadStore.savePreset(presetName.trim(), currentFormat, currentQuality, currentAutoDownload);
      setPresetName('');
      setShowSaveForm(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Presets</span>
          {presets.length > 0 && (
            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{presets.length}</span>
          )}
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-4 space-y-3">
          {/* Current config + save */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Current: <span className="font-medium text-gray-700 dark:text-gray-300">{currentFormat.toUpperCase()}</span>
              {' · '}<span className="font-medium text-gray-700 dark:text-gray-300">{currentQuality === 'best' ? 'Best' : `${currentQuality}p`}</span>
            </span>
            <button onClick={() => setShowSaveForm(!showSaveForm)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Save preset
            </button>
          </div>

          {showSaveForm && (
            <div className="flex gap-2">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <button onClick={handleSave} disabled={!presetName.trim()} className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 transition-all">Save</button>
              <button onClick={() => { setShowSaveForm(false); setPresetName(''); }} className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">Cancel</button>
            </div>
          )}

          {presets.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">No presets saved yet</p>
          ) : (
            <div className="space-y-2">
              {presets.map((preset) => (
                <div key={preset.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{preset.name}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{preset.format.toUpperCase()}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{preset.quality === 'best' ? 'Best quality' : `${preset.quality}p`}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onApplyPreset(preset)} className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Apply</button>
                    <button onClick={() => { if (confirm('Delete this preset?')) downloadStore.deletePreset(preset.id); }} className="text-xs px-3 py-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
