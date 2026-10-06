import React, { createContext, useContext, useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'syncscale_theme';

const ThemeContext = createContext({
    theme: 'system',
    resolvedTheme: 'light',
    setTheme: () => {},
});

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        if (typeof window === 'undefined') return 'system';
        try {
            return localStorage.getItem(THEME_STORAGE_KEY) || 'system';
        } catch {
            return 'system';
        }
    });

    const [resolvedTheme, setResolvedTheme] = useState(() => {
        if (typeof window === 'undefined') return 'light';
        try {
            const saved = localStorage.getItem(THEME_STORAGE_KEY) || 'system';
            if (saved === 'dark') return 'dark';
            if (saved === 'light') return 'light';
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } catch {
            return 'light';
        }
    });

    // テーマ設定の変更およびシステム設定の監視
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const updateTheme = () => {
            const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
            const active = isDark ? 'dark' : 'light';
            setResolvedTheme(active);

            const root = document.documentElement;
            if (isDark) {
                root.classList.add('dark');
                root.style.colorScheme = 'dark';
            } else {
                root.classList.remove('dark');
                root.style.colorScheme = 'light';
            }
        };

        updateTheme();

        const listener = () => {
            if (theme === 'system') {
                updateTheme();
            }
        };

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', listener);
            return () => mediaQuery.removeEventListener('change', listener);
        } else {
            mediaQuery.addListener(listener);
            return () => mediaQuery.removeListener(listener);
        }
    }, [theme]);

    const setTheme = (newTheme) => {
        setThemeState(newTheme);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch (e) {
            console.error('Failed to save theme to localStorage:', e);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
