'use client';

import React, { useContext } from 'react';
import { Box, Typography, IconButton, Tooltip, Stack } from '@mui/material';
import {
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    GitHub as GitHubIcon,
} from '@mui/icons-material';
import { ThemeContext } from './ThemeRegistry';

export function Header() {
    const { isDarkMode, toggleTheme } = useContext(ThemeContext);

    return (
        <Box
            component="header"
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                py: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                position: 'sticky',
                top: 0,
                zIndex: 1100,
            }}
        >
            <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box
                    sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        bgcolor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography
                        sx={{
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '1rem',
                        }}
                    >
                        T
                    </Typography>
                </Box>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                    }}
                >
                    Trading Model Simulator v2
                </Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
                <Tooltip title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
                    <IconButton onClick={toggleTheme} size="small">
                        {isDarkMode ? (
                            <LightModeIcon sx={{ color: 'warning.main' }} />
                        ) : (
                            <DarkModeIcon />
                        )}
                    </IconButton>
                </Tooltip>
            </Stack>
        </Box>
    );
}

export default Header;
