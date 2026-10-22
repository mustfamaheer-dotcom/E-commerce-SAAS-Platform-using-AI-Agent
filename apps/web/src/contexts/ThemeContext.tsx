// apps/web/src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  fontFamily: string;
}

interface ThemeContextType {
  theme: ThemeConfig;
  toggleMode: () => void;
  updateThemeColors: (colors: Partial<ThemeConfig>) => void;
}

const DEFAULT_THEME: ThemeConfig = {
  mode: 'dark',
  primaryColor: '#0ea5e9',
  secondaryColor: '#6366f1',
  accentColor: '#10b981',
  logoUrl: null,
  fontFamily: 'Cairo, sans-serif',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_THEME,
  toggleMode: () => {},
  updateThemeColors: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    try {
      const stored = localStorage.getItem('techzone_theme_config');
      if (stored) return JSON.parse(stored);
      const mode = (localStorage.getItem('techzone_theme') as 'light' | 'dark') || 'dark';
      return { ...DEFAULT_THEME, mode };
    } catch (_) {
      return DEFAULT_THEME;
    }
  });

  useEffect(() => {
    // Synchronize HTML element class
    if (theme.mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply CSS custom properties dynamically
    document.documentElement.style.setProperty('--brand-primary', theme.primaryColor);
    document.documentElement.style.setProperty('--brand-secondary', theme.secondaryColor);
    document.documentElement.style.setProperty('--brand-accent', theme.accentColor);

    try {
      localStorage.setItem('techzone_theme', theme.mode);
      localStorage.setItem('techzone_theme_config', JSON.stringify(theme));
    } catch (_) {}
  }, [theme]);

  const toggleMode = () => {
    setTheme((prev) => ({
      ...prev,
      mode: prev.mode === 'dark' ? 'light' : 'dark',
    }));
  };

  const updateThemeColors = (colors: Partial<ThemeConfig>) => {
    setTheme((prev) => ({ ...prev, ...colors }));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleMode, updateThemeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
