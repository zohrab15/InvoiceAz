import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const getInitialTheme = () => {
        const savedTheme = localStorage.getItem('invoice-az-theme');
        if (savedTheme) return savedTheme;
        return 'slate';
    };

    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('theme-slate', 'theme-money', 'theme-indigo', 'theme-dark');
        root.classList.add(`theme-${theme}`);
        localStorage.setItem('invoice-az-theme', theme);
    }, [theme]);

    const isDark = theme === 'dark';

    const value = {
        theme,
        setTheme,
        isDark,
        themes: [
            { id: 'slate', name: 'Slate', subtitle: 'Klassik', color: '#3b82f6', preview: ['#3b82f6', '#eff6ff', '#ffffff'] },
            { id: 'money', name: 'Money', subtitle: 'Maliyyə', color: '#10b981', preview: ['#10b981', '#064e3b', '#ecfdf5'] },
            { id: 'indigo', name: 'Indigo', subtitle: 'Premium', color: '#6366f1', preview: ['#6366f1', '#312e81', '#eef2ff'] },
            { id: 'dark', name: 'Gecə', subtitle: 'Qaranlıq', color: '#818cf8', preview: ['#818cf8', '#0a0a0f', '#12121a'] },
        ]
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
