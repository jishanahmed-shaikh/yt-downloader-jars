'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/theme-context';

export function ThemeToggle() {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed top-4 right-4 z-50">
      {isOpen && (
        <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-1.5 min-w-[140px]">
          {themes.map((t) => (
            <button
              key={t.name}
              onClick={() => { setTheme(t.name); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                theme === t.name
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white dark:bg-gray-800 p-2.5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        title="Change theme"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>
    </div>
  );
}
