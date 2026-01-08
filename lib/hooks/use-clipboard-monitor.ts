'use client';

import { useEffect, useState } from 'react';

export function useClipboardMonitor() {
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    let lastClipboard = '';
    
    const checkClipboard = async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          
          if (text !== lastClipboard && (text.includes('youtube.com') || text.includes('youtu.be'))) {
            lastClipboard = text;
            setClipboardUrl(text);
            setShowNotification(true);
            
            // Auto-hide notification after 5 seconds
            setTimeout(() => {
              setShowNotification(false);
            }, 5000);
          }
        }
      } catch (error) {
        // Clipboard access denied or not available
      }
    };

    // Check clipboard every 2 seconds
    const interval = setInterval(checkClipboard, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const useClipboardUrl = () => {
    setShowNotification(false);
    return clipboardUrl;
  };

  const dismissNotification = () => {
    setShowNotification(false);
  };

  return {
    clipboardUrl,
    showNotification,
    useClipboardUrl,
    dismissNotification,
  };
}