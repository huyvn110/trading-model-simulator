'use client';

import React, { useContext } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
    Box,
    Typography,
    IconButton,
    Tooltip,
    Stack,
    Button,
    Avatar,
    useTheme,
} from '@mui/material';
import {
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    TrendingUp as TrendingUpIcon,
    ShowChart as ChartIcon,
} from '@mui/icons-material';
import { ThemeContext } from './ThemeRegistry';

export function Header() {
    const { isDarkMode, toggleTheme } = useContext(ThemeContext);
    const { data: session } = useSession();
    const theme = useTheme();

    return (
        <Box
            component="header"
            className="glass-header"
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: { xs: 2, sm: 3 },
                py: 1.5,
                position: 'sticky',
                top: 0,
                zIndex: 1100,
                minHeight: 60,
            }}
        >
            {/* Logo & Title */}
            <Stack direction="row" alignItems="center" spacing={1.5}>
                {/* Logo icon with gradient glow */}
                <Box
                    sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #2383e2 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isDarkMode
                            ? '0 0 20px rgba(35, 131, 226, 0.4)'
                            : '0 4px 12px rgba(35, 131, 226, 0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'rotate(-5deg) scale(1.05)',
                            boxShadow: isDarkMode
                                ? '0 0 28px rgba(35, 131, 226, 0.6)'
                                : '0 6px 20px rgba(35, 131, 226, 0.45)',
                        },
                        cursor: 'default',
                    }}
                >
                    <ChartIcon sx={{ color: 'white', fontSize: 20 }} />
                </Box>

                <Box>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 800,
                            fontSize: '1rem',
                            background: isDarkMode
                                ? 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)'
                                : 'linear-gradient(135deg, #0f172a 0%, #475569 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.2,
                        }}
                    >
                        Trade Tracker
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'text.secondary',
                            fontSize: '0.68rem',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                        }}
                    >
                        Journal & Analytics
                    </Typography>
                </Box>
            </Stack>

            {/* Right: Controls */}
            <Stack direction="row" alignItems="center" spacing={1}>
                {/* Theme Toggle */}
                <Tooltip title={isDarkMode ? 'Chuyển Light Mode' : 'Chuyển Dark Mode'} arrow>
                    <IconButton
                        onClick={toggleTheme}
                        size="small"
                        sx={{
                            width: 36,
                            height: 36,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: isDarkMode
                                ? 'rgba(241, 245, 249, 0.05)'
                                : 'rgba(15, 23, 42, 0.04)',
                            '&:hover': {
                                bgcolor: isDarkMode
                                    ? 'rgba(241, 245, 249, 0.1)'
                                    : 'rgba(15, 23, 42, 0.08)',
                                borderColor: isDarkMode
                                    ? 'rgba(241, 245, 249, 0.2)'
                                    : 'rgba(15, 23, 42, 0.15)',
                            },
                        }}
                    >
                        {isDarkMode ? (
                            <LightModeIcon
                                sx={{
                                    fontSize: 18,
                                    color: '#fbbf24',
                                    filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.6))',
                                }}
                            />
                        ) : (
                            <DarkModeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        )}
                    </IconButton>
                </Tooltip>

                {session ? (
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 2 }}>
                        <Avatar 
                            src={session.user?.image || undefined} 
                            alt={session.user?.name || 'User'} 
                            sx={{ width: 32, height: 32 }} 
                        />
                        <Button 
                            variant="outlined" 
                            size="small" 
                            color="error"
                            onClick={() => signOut()}
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                            Đăng xuất
                        </Button>
                    </Stack>
                ) : (
                    <Button 
                        variant="contained" 
                        size="small" 
                        onClick={() => signIn('google')}
                        sx={{ 
                            ml: 2, 
                            textTransform: 'none', 
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #2383e2 0%, #8b5cf6 100%)',
                        }}
                    >
                        Đăng nhập
                    </Button>
                )}
            </Stack>
        </Box>
    );
}

export default Header;
