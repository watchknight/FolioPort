import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { chiptuneAudio } from '../utils/chiptuneAudio';

export type ThemeMode = 'dark' | 'light' | 'obsidian' | 'alabaster' | 'forest';
export type EditorialTheme = 'obsidian' | 'alabaster' | 'forest' | 'dark' | 'light';

export interface ThemeColors {
  id: string;
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

export const THEMES: Record<string, ThemeColors> = {
  dark: {
    id: 'dark',
    name: 'Night CRT • Void',
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
  light: {
    id: 'light',
    name: 'Daylight CAD • Putty',
    primaryColor: '#F2EFE9',
    accentColor: '#D90452',
    bgHex: '#F2EFE9',
    textHex: '#11131A',
    shaderColors: {
      baseColor: '#F2EFE9',
      rimColor: '#0052FF',
      accentColor: '#D90452',
      pointLight: '#0052FF',
      wireframe: '#0052FF',
    },
  },
  obsidian: {
    id: 'obsidian',
    name: 'Cyber-CRT Void',
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

export interface ThemeContextValue {
  theme: ThemeMode;
  isLight: boolean;
  isDark: boolean;
  setTheme: (theme: ThemeMode | EditorialTheme) => void;
  toggleTheme: () => void;
  isThemeFlashing: boolean;
  themeConfig: ThemeColors;
  availableThemes: ThemeColors[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const savedWk = localStorage.getItem('watchknight_theme') as ThemeMode | null;
      if (savedWk === 'dark' || savedWk === 'light') {
        return savedWk;
      }
      const savedEditorial = localStorage.getItem('folioport-editorial-theme');
      if (savedEditorial === 'alabaster') {
        return 'light';
      }
    }
    return 'dark';
  });

  const [isThemeFlashing, setIsThemeFlashing] = useState<boolean>(false);

  const applyTheme = useCallback((newMode: ThemeMode, playSfx = true) => {
    setThemeState(newMode);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('watchknight_theme', newMode);
        localStorage.setItem('folioport-editorial-theme', newMode === 'light' ? 'alabaster' : 'obsidian');
        document.documentElement.setAttribute('data-theme', newMode);
        document.documentElement.classList.toggle('dark', newMode === 'dark');
        document.documentElement.classList.toggle('light', newMode === 'light');
      } catch {
        // Safe localStorage fallback
      }

      // Fast 250ms CRT horizontal-sync flash / degauss wipe across viewport
      setIsThemeFlashing(true);
      setTimeout(() => {
        setIsThemeFlashing(false);
      }, 250);

      // Procedural Web Audio toggle chime
      if (playSfx) {
        try {
          chiptuneAudio.playPowerUpSFX();
        } catch {
          // Safe audio fallback
        }
      }

      // Dispatch global events for Three.js shaders and DOM listeners
      const config = THEMES[newMode] || THEMES.dark;
      window.dispatchEvent(
        new CustomEvent('watchknight-theme-change', {
          detail: { theme: newMode, isLight: newMode === 'light', config },
        })
      );
      window.dispatchEvent(
        new CustomEvent('editorial-theme-change', {
          detail: config,
        })
      );
    }
  }, []);

  const setTheme = useCallback(
    (inputTheme: ThemeMode | EditorialTheme) => {
      let resolved: ThemeMode = 'dark';
      if (inputTheme === 'light' || inputTheme === 'alabaster') {
        resolved = 'light';
      } else {
        resolved = 'dark';
      }
      applyTheme(resolved, true);
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
      // Apply theme effects asynchronously outside of reducer phase
      setTimeout(() => {
        applyTheme(next, true);
      }, 0);
      return next;
    });
  }, [applyTheme]);

  // Initial sync on mount without re-playing chime
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.classList.toggle('light', theme === 'light');
    }
  }, [theme]);

  const value: ThemeContextValue = {
    theme,
    isLight: theme === 'light',
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
    isThemeFlashing,
    themeConfig: THEMES[theme] || THEMES.dark,
    availableThemes: [THEMES.dark, THEMES.light],
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
      {/* Fast 250ms CRT horizontal-sync flash & degauss beam wipe */}
      {isThemeFlashing && (
        <div
          className="crt-hsync-wipe pointer-events-none fixed inset-0 z-[99999]"
          aria-hidden="true"
        />
      )}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'dark',
      isLight: false,
      isDark: true,
      setTheme: () => {},
      toggleTheme: () => {},
      isThemeFlashing: false,
      themeConfig: THEMES.dark,
      availableThemes: [THEMES.dark, THEMES.light],
    };
  }
  return context;
};

export default ThemeContext;
