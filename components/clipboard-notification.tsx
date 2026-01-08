'use client';

interface ClipboardNotificationProps {
  url: string;
  onUse: () => void;
  onDismiss: () => void;
}

export function ClipboardNotification({ url, onUse, onDismiss }: ClipboardNotificationProps) {
  const getVideoTitle = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        return 'YouTube Video Detected';
      }
      return 'YouTube URL Detected';
    } catch {
      return 'YouTube URL Detected';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 max-w-sm animate-slide-in">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <span className="text-red-600 dark:text-red-400">📋</span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {getVideoTitle(url)}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
            {url}
          </p>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={onUse}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              📥 Use URL
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Dismiss
            </button>
          </div>
        </div>
        
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}