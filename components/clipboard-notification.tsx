'use client';

interface ClipboardNotificationProps {
  url: string;
  onUse: () => void;
  onDismiss: () => void;
}

export function ClipboardNotification({ url, onUse, onDismiss }: ClipboardNotificationProps) {
  return (
    <div className="fixed bottom-20 right-5 z-50 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg p-4 max-w-xs animate-slide-in">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">YouTube URL detected</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{url}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onUse}
              className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Use URL
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button onClick={onDismiss} className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
