'use client';

import { createTheme, ThemeOptions, alpha } from '@mui/material/styles';

// ─── Color Palette ─────────────────────────────────────────────────────────────
const colors = {
    // Primary - Electric Blue
    primary: '#2383e2',
    primaryLight: '#529aec',
    primaryDark: '#1a6bc2',

    // Profit (Emerald)
    emerald: '#10b981',
    emeraldLight: '#34d399',
    emeraldDark: '#059669',

    // Loss (Rose)
    rose: '#f43f5e',
    roseLight: '#fb7185',
    roseDark: '#e11d48',

    // Warning (Amber)
    amber: '#f59e0b',
    amberLight: '#fbbf24',

    // Dark "Midnight" palette
    midnight: {
        50: '#f0f4ff',
        100: '#e0e8ff',
        900: '#0a0e1a',
        800: '#0f1629',
        700: '#131d35',
        600: '#1a2540',
        500: '#1e2d4d',
        400: '#243358',
        300: '#2d3f6b',
        200: '#3d5080',
        100: '#6b7ea8',
        50: '#94a3b8',
    },
};

// ─── Factor Colors (for chips) ─────────────────────────────────────────────────
export const FACTOR_COLORS = [
    { bg: '#2383e2', light: 'rgba(35,131,226,0.15)', text: '#60a5fa' },   // Blue
    { bg: '#10b981', light: 'rgba(16,185,129,0.15)', text: '#34d399' },   // Emerald
    { bg: '#8b5cf6', light: 'rgba(139,92,246,0.15)',  text: '#a78bfa' },   // Violet
    { bg: '#f59e0b', light: 'rgba(245,158,11,0.15)',  text: '#fbbf24' },   // Amber
    { bg: '#ec4899', light: 'rgba(236,72,153,0.15)',  text: '#f472b6' },   // Pink
    { bg: '#06b6d4', light: 'rgba(6,182,212,0.15)',   text: '#22d3ee' },   // Cyan
    { bg: '#f43f5e', light: 'rgba(244,63,94,0.15)',   text: '#fb7185' },   // Rose
    { bg: '#84cc16', light: 'rgba(132,204,22,0.15)',  text: '#a3e635' },   // Lime
];

// ─── Light Theme Options ────────────────────────────────────────────────────────
const baseOptions: ThemeOptions = {
    palette: {
        mode: 'light',
        primary: {
            main: colors.primary,
            light: colors.primaryLight,
            dark: colors.primaryDark,
        },
        secondary: {
            main: colors.rose,
            light: colors.roseLight,
            dark: colors.roseDark,
        },
        success: {
            main: colors.emerald,
            light: colors.emeraldLight,
            dark: colors.emeraldDark,
        },
        warning: {
            main: colors.amber,
            light: colors.amberLight,
        },
        error: {
            main: colors.rose,
            light: colors.roseLight,
        },
        background: {
            default: '#f8faff',
            paper: '#ffffff',
        },
        text: {
            primary: '#0f172a',
            secondary: '#475569',
        },
        divider: 'rgba(15, 23, 42, 0.08)',
        grey: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
        },
    },
    typography: {
        fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        h1: { fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em' },
        h2: { fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.02em' },
        h3: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.01em' },
        h4: { fontSize: '1.25rem', fontWeight: 600 },
        h5: { fontSize: '1.125rem', fontWeight: 600 },
        h6: { fontSize: '0.95rem', fontWeight: 600 },
        body1: { fontSize: '0.9375rem', lineHeight: 1.65 },
        body2: { fontSize: '0.875rem', lineHeight: 1.55 },
        caption: { fontSize: '0.75rem', letterSpacing: '0.01em' },
        button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
    },
    shape: { borderRadius: 10 },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    padding: '8px 16px',
                    boxShadow: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': { boxShadow: 'none', transform: 'translateY(-1px)' },
                    '&:active': { transform: 'translateY(0px)' },
                },
                contained: {
                    '&:hover': {
                        boxShadow: '0 4px 14px rgba(35, 131, 226, 0.35)',
                    },
                },
                containedSuccess: {
                    '&:hover': {
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    },
                },
                containedError: {
                    '&:hover': {
                        boxShadow: '0 4px 14px rgba(244, 63, 94, 0.35)',
                    },
                },
                outlined: {
                    borderColor: 'rgba(15, 23, 42, 0.15)',
                    '&:hover': {
                        borderColor: colors.primary,
                        backgroundColor: alpha(colors.primary, 0.05),
                    },
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        backgroundColor: 'rgba(15, 23, 42, 0.07)',
                        transform: 'scale(1.05)',
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    transition: 'all 0.15s ease',
                    '&:hover': { transform: 'translateY(-1px)' },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 10,
                        backgroundColor: 'rgba(248, 250, 255, 0.8)',
                        transition: 'all 0.2s ease',
                        '& fieldset': { borderColor: 'rgba(15, 23, 42, 0.15)', transition: 'border-color 0.2s' },
                        '&:hover fieldset': { borderColor: colors.primary },
                        '&.Mui-focused': {
                            backgroundColor: '#ffffff',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: colors.primary,
                            borderWidth: 2,
                            boxShadow: `0 0 0 4px ${alpha(colors.primary, 0.1)}`,
                        },
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 14,
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.05)',
                    border: '1px solid rgba(15, 23, 42, 0.07)',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
                        transform: 'translateY(-2px)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    borderRadius: 14,
                },
                elevation1: {
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.05)',
                },
                elevation6: {
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12), 0 4px 8px rgba(15, 23, 42, 0.08)',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid rgba(15, 23, 42, 0.07)',
                    padding: '12px 16px',
                },
                head: {
                    fontWeight: 700,
                    backgroundColor: '#f1f5f9',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#64748b',
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: '#0f172a',
                    fontSize: '0.78rem',
                    padding: '6px 10px',
                    borderRadius: 8,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                },
                arrow: { color: '#0f172a' },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    textTransform: 'none',
                    minHeight: 40,
                    transition: 'all 0.2s ease',
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                    background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryLight})`,
                },
            },
        },
        MuiLinearProgress: {
            styleOverrides: {
                root: { borderRadius: 6, height: 6 },
                bar: { borderRadius: 6 },
            },
        },
        MuiCheckbox: {
            styleOverrides: {
                root: {
                    color: 'rgba(15, 23, 42, 0.35)',
                    '&.Mui-checked': { color: colors.primary },
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: { borderRadius: 10 },
            },
        },
    },
};

export const lightTheme = createTheme(baseOptions);

// ─── Dark "Midnight" Theme ──────────────────────────────────────────────────────
export const darkTheme = createTheme({
    ...baseOptions,
    palette: {
        mode: 'dark',
        primary: {
            main: colors.primaryLight,
            light: '#7ab5f2',
            dark: colors.primary,
        },
        secondary: {
            main: colors.roseLight,
            dark: colors.rose,
        },
        success: {
            main: colors.emeraldLight,
            light: '#6ee7b7',
            dark: colors.emerald,
        },
        warning: {
            main: colors.amberLight,
            light: '#fcd34d',
        },
        error: {
            main: colors.roseLight,
            dark: colors.rose,
        },
        background: {
            default: colors.midnight[900],
            paper: colors.midnight[800],
        },
        text: {
            primary: 'rgba(241, 245, 249, 0.95)',
            secondary: 'rgba(148, 163, 184, 0.9)',
        },
        divider: 'rgba(241, 245, 249, 0.08)',
        grey: {
            50:  colors.midnight[700],
            100: colors.midnight[600],
            200: colors.midnight[500],
            300: colors.midnight[400],
            400: colors.midnight[300],
            500: colors.midnight[200],
            600: colors.midnight[100],
        },
    },
    components: {
        ...baseOptions.components,
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    padding: '8px 16px',
                    boxShadow: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': { boxShadow: 'none', transform: 'translateY(-1px)' },
                    '&:active': { transform: 'translateY(0px)' },
                },
                contained: {
                    '&:hover': {
                        boxShadow: '0 4px 20px rgba(82, 154, 236, 0.4)',
                    },
                },
                containedSuccess: {
                    '&:hover': {
                        boxShadow: '0 4px 20px rgba(52, 211, 153, 0.4)',
                    },
                },
                containedError: {
                    '&:hover': {
                        boxShadow: '0 4px 20px rgba(251, 113, 133, 0.4)',
                    },
                },
                outlined: {
                    borderColor: 'rgba(241, 245, 249, 0.15)',
                    '&:hover': {
                        borderColor: colors.primaryLight,
                        backgroundColor: alpha(colors.primaryLight, 0.08),
                    },
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    color: 'rgba(148, 163, 184, 0.9)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        backgroundColor: 'rgba(241, 245, 249, 0.08)',
                        color: 'rgba(241, 245, 249, 0.95)',
                        transform: 'scale(1.05)',
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 10,
                        backgroundColor: alpha(colors.midnight[700], 0.6),
                        backdropFilter: 'blur(8px)',
                        transition: 'all 0.2s ease',
                        '& fieldset': {
                            borderColor: 'rgba(241, 245, 249, 0.12)',
                            transition: 'all 0.2s',
                        },
                        '&:hover fieldset': { borderColor: colors.primaryLight },
                        '&.Mui-focused': {
                            backgroundColor: alpha(colors.midnight[600], 0.8),
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: colors.primaryLight,
                            borderWidth: 2,
                            boxShadow: `0 0 0 4px ${alpha(colors.primaryLight, 0.12)}`,
                        },
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    borderRadius: 14,
                    backgroundColor: colors.midnight[800],
                },
                elevation0: {
                    backgroundColor: colors.midnight[800],
                },
                elevation1: {
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
                    border: `1px solid rgba(241, 245, 249, 0.07)`,
                },
                elevation6: {
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.3)',
                    border: `1px solid rgba(241, 245, 249, 0.08)`,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 14,
                    backgroundColor: colors.midnight[800],
                    border: '1px solid rgba(241, 245, 249, 0.07)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        transform: 'translateY(-2px)',
                        borderColor: 'rgba(241, 245, 249, 0.12)',
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid rgba(241, 245, 249, 0.07)',
                    padding: '12px 16px',
                },
                head: {
                    fontWeight: 700,
                    backgroundColor: colors.midnight[700],
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: colors.midnight[50],
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                    background: `linear-gradient(90deg, ${colors.primaryLight}, #a78bfa)`,
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: colors.midnight[700],
                    border: '1px solid rgba(241,245,249,0.1)',
                    fontSize: '0.78rem',
                    padding: '6px 10px',
                    borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                },
                arrow: { color: colors.midnight[700] },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    backgroundColor: colors.midnight[700],
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    transition: 'all 0.15s ease',
                    '&:hover': { transform: 'translateY(-1px)' },
                },
            },
        },
    },
});
