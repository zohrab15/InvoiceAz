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
    // Priority: Saved theme > OS preference > 'slate'
    const getInitialTheme = () => {
        const savedTheme = localStorage.getItem('invoice-az-theme');
        if (savedTheme) return savedTheme;
        return 'slate';
    };

    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        // Remove previous theme classes
        const root = window.document.documentElement;
        root.classList.remove('theme-slate', 'theme-money', 'theme-indigo');

        // Add current theme class
        root.classList.add(`theme-${theme}`);

        // Persist
        localStorage.setItem('invoice-az-theme', theme);
    }, [theme]);

    const value = {
        theme,
        setTheme,
        themes: [
            { id: 'slate', name: 'Slate (Modern)', color: '#3b82f6' },
            { id: 'money', name: 'Money (Midnight)', color: '#10b981' },
            { id: 'indigo', name: 'Indigo (Royal)', color: '#6366f1' }
        ]
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
