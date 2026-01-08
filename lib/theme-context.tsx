'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'blue' | 'green' | 'purple' | 'orange';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: Array<{ name: Theme; label: string; colors: string }>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes = [
  { name: 'light' as Theme, label: '☀️ Light', colors: 'bg-white text-gray-900' },
  { name: 'dark' as Theme, label: '🌙 Dark', colors: 'bg-gray-900 text-white' },
  { name: 'blue' as Theme, label: '🔵 Ocean', colors: 'bg-blue-50 text-blue-900' },
  { name: 'green' as Theme, label: '🟢 Forest', colors: 'bg-green-50 text-green-900' },
  { name: 'purple' as Theme, label: '🟣 Galaxy', colors: 'bg-purple-50 text-purple-900' },
  { name: 'orange' as Theme, label: '🟠 Sunset', colors: 'bg-orange-50 text-orange-900' },
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as Theme;
    if (savedTheme && themes.find(t => t.name === savedTheme)) {
      setThemeState(savedTheme);
    } else {
      // Auto-detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeState(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark', 'theme-blue', 'theme-green', 'theme-purple', 'theme-orange');
    
    // Add current theme class
    if (theme === 'light' || theme === 'dark') {
      root.classList.add(theme);
    } else {
      root.classList.add('light', `theme-${theme}`);
    }
    
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}