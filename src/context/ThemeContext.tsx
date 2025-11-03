import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme as baseTheme, paletteLight, paletteDark, type Palette } from '@styles/theme';

export type ThemeMode = 'light' | 'dark';


export type AppThemeContextValue = {
    mode: ThemeMode;
    isDark: boolean;
    theme: typeof baseTheme;
    palette: Palette;
    toggle: () => void;
    setTheme: (mode: ThemeMode) => void;
};

const defaultValue: AppThemeContextValue = {
    mode: 'light',
    isDark: false,
    theme: baseTheme,
    palette: paletteLight,
    toggle: () => { },
    setTheme: () => { },
};

const ThemeContext = createContext<AppThemeContextValue>(defaultValue);

const STORAGE_KEY = 'app_theme_mode';

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [mode, setMode] = useState<ThemeMode>('light');

    useEffect(() => {
        loadSavedTheme();
    }, []);

    const loadSavedTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(STORAGE_KEY);
            if (savedTheme === 'light' || savedTheme === 'dark') {
                setMode(savedTheme);
            }
        } catch (error) {
            console.error('Failed to load theme:', error);
        }
    };

    const saveTheme = async (themeMode: ThemeMode) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, themeMode);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    };

    const toggle = () => {
        const newMode = mode === 'dark' ? 'light' : 'dark';
        setMode(newMode);
        saveTheme(newMode);
    };

    const setTheme = (themeMode: ThemeMode) => {
        setMode(themeMode);
        saveTheme(themeMode);
    };

    const value = useMemo<AppThemeContextValue>(() => {
        const isDark = mode === 'dark';
        return {
            mode,
            isDark,
            theme: baseTheme,
            palette: isDark ? paletteDark : paletteLight,
            toggle,
            setTheme,
        };
    }, [mode]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);