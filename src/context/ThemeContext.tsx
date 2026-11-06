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
    name: 'Obsidian & Rust',
    primaryColor: '#0A0A0A',
    accentColor: '#A74024',
    bgHex: '#0A0A0A',
    textHex: '#F4F3EF',
    shaderColors: {
      baseColor: '#0A0A0A',
      rimColor: '#DF6C4F',
      accentColor: '#A74024',
      pointLight: '#DF6C4F',
      wireframe: '#DF6C4F',
    },
  },
  alabaster: {
    id: 'alabaster',
    name: 'Editorial Alabaster',
    primaryColor: '#F4F3EF',
    accentColor: '#111111',
    bgHex: '#F4F3EF',
    textHex: '#111111',
    shaderColors: {
      baseColor: '#F4F3EF',
      rimColor: '#A74024',
      accentColor: '#111111',
      pointLight: '#A74024',
      wireframe: '#111111',
    },
  },
  forest: {
    id: 'forest',
    name: 'Deep Forest Clay',
    primaryColor: '#141E19',
    accentColor: '#81C995',
    bgHex: '#141E19',
    textHex: '#E6EDE8',
    shaderColors: {
      baseColor: '#141E19',
      rimColor: '#81C995',
      accentColor: '#81C995',
      pointLight: '#81C995',
      wireframe: '#81C995',
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
