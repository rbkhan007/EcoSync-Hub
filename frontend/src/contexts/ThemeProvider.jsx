import React, { useState, useEffect, useMemo } from 'react';
import { ThemeContext } from './ThemeContext';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#4caf50', dark: '#1b5e20', light: '#81c784' },
        secondary: { main: '#00e676' },
        background: { default: '#f8fdf9' },
    },
    typography: {
        fontFamily: '"Outfit", "Inter", sans-serif',
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 16 },
});

const draculaTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#bd93f9', dark: '#6272a4', light: '#ff79c6' },
        secondary: { main: '#50fa7b' },
        background: { default: '#282a36', paper: '#44475a' },
        text: { primary: '#f8f8f2', secondary: '#6272a4' }
    },
    typography: {
        fontFamily: '"Outfit", "Inter", sans-serif',
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 16 },
});

const nordTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#88c0d0', dark: '#5e81ac', light: '#8fbcbb' },
        secondary: { main: '#a3be8c' },
        background: { default: '#2e3440', paper: '#3b4252' },
        text: { primary: '#eceff4', secondary: '#d8dee9' }
    },
    typography: {
        fontFamily: '"Outfit", "Inter", sans-serif',
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 16 },
});

export const ThemeProvider = ({ children }) => {
    const [themeName, setThemeName] = useState(localStorage.getItem('theme') || 'eco');

    useEffect(() => {
        localStorage.setItem('theme', themeName);
        document.body.className = `theme-${themeName}`;
    }, [themeName]);

    const muiTheme = useMemo(() => {
        switch (themeName) {
            case 'dracula': return draculaTheme;
            case 'nord': return nordTheme;
            default: return lightTheme;
        }
    }, [themeName]);

    return (
        <ThemeContext.Provider value={{ theme: themeName, setTheme: setThemeName }}>
            <MUIThemeProvider theme={muiTheme}>
                <CssBaseline />
                {children}
            </MUIThemeProvider>
        </ThemeContext.Provider>
    );
};
