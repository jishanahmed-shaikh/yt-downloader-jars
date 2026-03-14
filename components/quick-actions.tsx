'use client';

import { useState } from 'react';
import { downloadStore } from '@/lib/download-store';

export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: 'Clear completed',
      onClick: () => { downloadStore.clearCompleted(); setIsOpen(false); },
      className: 'text-gray-600 dark:text-gray-300',
    },
    {
      label: 'Copy sample URL',
      onClick: () => {
        navigator.clipboard.writeText('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        setIsOpen(false);
      },
      className: 'text-gray-600 dark:text-gray-300',
    },
    {
      label: 'Clear all data',
      onClick: () => {
        if (confirm('Clear all download history and queue?')) {
          localStorage.clear();
          window.location.reload();
        }
      },
      className: 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="absolute bottom-12 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-1.5 min-w-[160px]">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${action.className}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-red-600 hover:bg-red-700 text-white w-10 h-10 rounded-full shadow-lg transition-all flex items-center justify-center"
        title="Quick actions"
      >
        <svg className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
    </div>
  );
}
