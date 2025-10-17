import React, { createContext, useContext, useMemo, useState } from 'react';

type Theme = {
  mode: 'light' | 'dark';
  colors: {
    background: string;
    text: string;
    primary: string;
  };
};

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
};

const defaultTheme: Theme = {
  mode: 'light',
  colors: {
    background: '#ffffff',
    text: '#111111',
    primary: '#3b82f6',
  },
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  toggle: () => {},
});

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const theme = useMemo<Theme>(() => ({
    mode,
    colors: {
      background: mode === 'dark' ? '#000000' : '#ffffff',
      text: mode === 'dark' ? '#ffffff' : '#111111',
      primary: '#3b82f6',
    },
  }), [mode]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    toggle: () => setMode(m => (m === 'dark' ? 'light' : 'dark')),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

