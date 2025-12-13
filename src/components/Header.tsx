'use client';

import React, { useContext, useState } from 'react';
import { Box, Typography, IconButton, Tooltip, Stack } from '@mui/material';
import {
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    GitHub as GitHubIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { ThemeContext } from './ThemeRegistry';

export function Header() {
    const { isDarkMode, toggleTheme } = useContext(ThemeContext);
    const [logoError, setLogoError] = useState(false);

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
                {logoError ? (
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
                        <TrendingUpIcon sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                ) : (
                    <Box
                        component="img"
                        src="/logo.png"
                        alt="Logo"
                        onError={() => setLogoError(true)}
                        sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                        }}
                    />
                )}
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                    }}
                >
                    Trade Tracker
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
