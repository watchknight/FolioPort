import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type EditorialTheme = 'obsidian' | 'alabaster' | 'forest';

export interface ThemeColors {
  id: EditorialTheme;
  name: string;
  primaryColor: string;
  accentColor: string;
  bgHex: string;
  textHex: string;
  shaderColors: {
    baseColor: string;
    rimColor: string;
    accentColor: string;
    pointLight: string;
    wireframe: string;
  };
}

export const THEMES: Record<EditorialTheme, ThemeColors> = {
  obsidian: {
    id: 'obsidian',
    name: 'SYS.96 Cyber-CRT Void',
    primaryColor: '#070814',
    accentColor: '#FF2A85',
    bgHex: '#070814',
    textHex: '#F0EFE6',
    shaderColors: {
      baseColor: '#070814',
      rimColor: '#00F0FF',
      accentColor: '#FF2A85',
      pointLight: '#00F0FF',
      wireframe: '#00F0FF',
    },
  },
  alabaster: {
    id: 'alabaster',
    name: 'Retro Putty Bezel',
    primaryColor: '#D6CFC2',
    accentColor: '#FF2A85',
    bgHex: '#D6CFC2',
    textHex: '#070814',
    shaderColors: {
      baseColor: '#D6CFC2',
      rimColor: '#2D3645',
      accentColor: '#FF2A85',
      pointLight: '#00F0FF',
      wireframe: '#2D3645',
    },
  },
  forest: {
    id: 'forest',
    name: 'Phosphor Green Terminal',
    primaryColor: '#0D1512',
    accentColor: '#4AF626',
    bgHex: '#0D1512',
    textHex: '#4AF626',
    shaderColors: {
      baseColor: '#0D1512',
      rimColor: '#4AF626',
      accentColor: '#4AF626',
      pointLight: '#4AF626',
      wireframe: '#4AF626',
    },
  },
};

interface ThemeContextValue {
  theme: EditorialTheme;
  themeConfig: ThemeColors;
  setTheme: (theme: EditorialTheme) => void;
  availableThemes: ThemeColors[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<EditorialTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('folioport-editorial-theme') as EditorialTheme;
      if (saved && (saved === 'obsidian' || saved === 'alabaster' || saved === 'forest')) {
        return saved;
      }
    }
    return 'obsidian';
  });

  const setTheme = useCallback((newTheme: EditorialTheme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('folioport-editorial-theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);

      // Dispatch global window event for 3D shaders, WebGL canvas, and audio feedback
      const config = THEMES[newTheme];
      window.dispatchEvent(
        new CustomEvent('editorial-theme-change', {
          detail: config,
        })
      );
    }
  }, []);

  // Sync initial theme attribute on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const config = THEMES[theme];
    window.dispatchEvent(
      new CustomEvent('editorial-theme-change', {
        detail: config,
      })
    );
  }, [theme]);

  const value: ThemeContextValue = {
    theme,
    themeConfig: THEMES[theme],
    setTheme,
    availableThemes: [THEMES.obsidian, THEMES.alabaster, THEMES.forest],
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
