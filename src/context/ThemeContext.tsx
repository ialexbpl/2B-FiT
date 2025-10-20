import React, { createContext, useContext, useMemo, useState } from 'react';
import { theme as baseTheme, paletteLight, paletteDark, type Palette } from '@styles/theme';

export type ThemeMode = 'light' | 'dark';

//logic of changing themes

export type AppThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  // Static design tokens (spacing, radii, brand colors etc.)
  theme: typeof baseTheme;
  // Dynamic palette based on mode
  palette: Palette;
  toggle: () => void;
};

const defaultValue: AppThemeContextValue = {
  mode: 'light',
  isDark: false,
  theme: baseTheme,
  palette: paletteLight,
  toggle: () => {},
};

const ThemeContext = createContext<AppThemeContextValue>(defaultValue);

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  const value = useMemo<AppThemeContextValue>(() => {
    const isDark = mode === 'dark';
    return {
      mode,
      isDark,
      theme: baseTheme,
      palette: isDark ? paletteDark : paletteLight,
      toggle: () => setMode(m => (m === 'dark' ? 'light' : 'dark')),
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

