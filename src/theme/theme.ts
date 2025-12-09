'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';

const themeOptions: ThemeOptions = {
    palette: {
        mode: 'light',
        primary: {
            main: '#2383e2',
            light: '#529aec',
            dark: '#1a6bc2',
        },
        secondary: {
            main: '#eb5757',
            light: '#ef7a7a',
            dark: '#d14646',
        },
        background: {
            default: '#ffffff',
            paper: '#ffffff',
        },
        text: {
            primary: '#37352f',
            secondary: '#6b6b6b',
        },
        divider: 'rgba(55, 53, 47, 0.09)',
        grey: {
            50: '#fafafa',
            100: '#f7f6f3',
            200: '#ebeced',
            300: '#e0e0e0',
            400: '#bdbdbd',
            500: '#9e9e9e',
        },
        success: {
            main: '#0f7b6c',
            light: '#4dab9a',
        },
        warning: {
            main: '#cb912f',
            light: '#e9b44c',
        },
        error: {
            main: '#eb5757',
        },
    },
    typography: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        h1: {
            fontSize: '2.5rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
        },
        h2: {
            fontSize: '1.875rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
        },
        h3: {
            fontSize: '1.5rem',
            fontWeight: 600,
        },
        h4: {
            fontSize: '1.25rem',
            fontWeight: 600,
        },
        h5: {
            fontSize: '1rem',
            fontWeight: 600,
        },
        h6: {
            fontSize: '0.875rem',
            fontWeight: 600,
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
        },
        button: {
            textTransform: 'none',
            fontWeight: 500,
        },
    },
    shape: {
        borderRadius: 6,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    padding: '6px 12px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
                contained: {
                    '&:hover': {
                        boxShadow: 'rgba(15, 15, 15, 0.1) 0px 2px 4px',
                    },
                },
                outlined: {
                    borderColor: 'rgba(55, 53, 47, 0.16)',
                    '&:hover': {
                        borderColor: 'rgba(55, 53, 47, 0.3)',
                        backgroundColor: 'rgba(55, 53, 47, 0.04)',
                    },
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    color: 'rgba(55, 53, 47, 0.65)',
                    '&:hover': {
                        backgroundColor: 'rgba(55, 53, 47, 0.08)',
                    },
                },
            },
        },
        MuiCheckbox: {
            styleOverrides: {
                root: {
                    color: 'rgba(55, 53, 47, 0.4)',
                    borderRadius: 4,
                    '&.Mui-checked': {
                        color: '#2383e2',
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 6,
                        backgroundColor: '#ffffff',
                        '& fieldset': {
                            borderColor: 'rgba(55, 53, 47, 0.16)',
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(55, 53, 47, 0.3)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#2383e2',
                            borderWidth: 2,
                        },
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    boxShadow: 'rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px',
                    border: '1px solid rgba(55, 53, 47, 0.09)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
                elevation1: {
                    boxShadow: 'rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 4,
                    fontWeight: 500,
                },
            },
        },
        MuiSlider: {
            styleOverrides: {
                root: {
                    height: 6,
                    '& .MuiSlider-thumb': {
                        width: 16,
                        height: 16,
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid rgba(55, 53, 47, 0.09)',
                },
                head: {
                    fontWeight: 600,
                    backgroundColor: '#f7f6f3',
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: '#37352f',
                    fontSize: '0.75rem',
                    padding: '4px 8px',
                },
            },
        },
    },
};

export const lightTheme = createTheme(themeOptions);

export const darkTheme = createTheme({
    ...themeOptions,
    palette: {
        mode: 'dark',
        primary: {
            main: '#529aec',
            light: '#7ab5f2',
            dark: '#2383e2',
        },
        secondary: {
            main: '#ef7a7a',
        },
        background: {
            default: '#191919',
            paper: '#202020',
        },
        text: {
            primary: 'rgba(255, 255, 255, 0.9)',
            secondary: 'rgba(255, 255, 255, 0.6)',
        },
        divider: 'rgba(255, 255, 255, 0.1)',
        grey: {
            50: '#2d2d2d',
            100: '#252525',
            200: '#333333',
            300: '#404040',
            400: '#5c5c5c',
            500: '#757575',
        },
    },
    components: {
        ...themeOptions.components,
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    padding: '6px 12px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
                contained: {
                    '&:hover': {
                        boxShadow: 'rgba(0, 0, 0, 0.3) 0px 2px 4px',
                    },
                },
                outlined: {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 6,
                        backgroundColor: '#2d2d2d',
                        '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#529aec',
                            borderWidth: 2,
                        },
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                },
                head: {
                    fontWeight: 600,
                    backgroundColor: '#252525',
                },
            },
        },
    },
});
