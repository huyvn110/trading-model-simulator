'use client';

import React, { useContext } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
    Avatar,
    Box,
    IconButton,
    Stack,
    Tooltip,
} from '@mui/material';
import {
    DarkMode as DarkModeIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    LightMode as LightModeIcon,
    Login as LoginIcon,
    Logout as LogoutIcon,
    ViewSidebarOutlined as WorkspaceIcon,
} from '@mui/icons-material';
import { ThemeContext } from './ThemeRegistry';

interface HeaderProps {
    sidebarOpen: boolean;
    onToggleSidebar: () => void;
}

export function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
    const { isDarkMode, toggleTheme } = useContext(ThemeContext);
    const { data: session } = useSession();
    const sidebarTitle = sidebarOpen ? 'Ẩn sidebar' : 'Mở sidebar';

    const iconButtonSx = {
        width: 30,
        height: 30,
        borderRadius: '8px',
        color: isDarkMode ? 'rgba(245, 245, 245, 0.86)' : 'rgba(24, 24, 27, 0.82)',
        bgcolor: 'transparent',
        '&:hover': {
            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(24, 24, 27, 0.06)',
        },
    };

    return (
        <Box
            component="header"
            className="glass-header"
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: { xs: 1.5, sm: 2 },
                py: 1,
                position: 'sticky',
                top: 0,
                zIndex: 1100,
                minHeight: 54,
            }}
        >
            <Stack direction="row" alignItems="center" spacing={1}>
                <Tooltip title="Trade Tracker" arrow>
                    <Box
                        component="img"
                        src="/brand-mark.svg"
                        alt="Trade Tracker"
                        aria-label="Trade Tracker"
                        sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '8px',
                            display: 'block',
                            objectFit: 'contain',
                            boxShadow: isDarkMode
                                ? '0 4px 14px rgba(0, 0, 0, 0.28)'
                                : '0 4px 14px rgba(21, 23, 25, 0.18)',
                        }}
                    />
                </Tooltip>

                <Tooltip title={sidebarTitle} arrow>
                    <Box
                        component="button"
                        type="button"
                        aria-label={sidebarTitle}
                        onClick={onToggleSidebar}
                        sx={{
                            height: 34,
                            minWidth: 58,
                            px: 0.85,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.45,
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: 'transparent',
                            color: isDarkMode ? 'rgba(245, 245, 245, 0.82)' : 'rgba(24, 24, 27, 0.78)',
                            bgcolor: 'transparent',
                            cursor: 'pointer',
                            '&:hover': {
                                borderColor: isDarkMode ? 'rgba(245, 245, 245, 0.14)' : 'rgba(24, 24, 27, 0.12)',
                                bgcolor: isDarkMode ? 'rgba(245, 245, 245, 0.07)' : 'rgba(24, 24, 27, 0.05)',
                                color: isDarkMode ? '#f5f5f5' : '#18181b',
                            },
                            '&:focus-visible': {
                                borderColor: isDarkMode ? 'rgba(245, 245, 245, 0.18)' : 'rgba(24, 24, 27, 0.16)',
                                bgcolor: isDarkMode ? 'rgba(245, 245, 245, 0.08)' : 'rgba(24, 24, 27, 0.06)',
                            },
                        }}
                    >
                        <WorkspaceIcon sx={{ fontSize: 17 }} />
                        <KeyboardArrowDownIcon
                            sx={{
                                fontSize: 16,
                                transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                            }}
                        />
                    </Box>
                </Tooltip>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={0.5}>
                <Tooltip title={isDarkMode ? 'Light mode' : 'Dark mode'} arrow>
                    <IconButton onClick={toggleTheme} size="small" sx={iconButtonSx}>
                        {isDarkMode ? (
                            <LightModeIcon
                                sx={{
                                    fontSize: 17,
                                    color: '#fbbf24',
                                    filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.6))',
                                }}
                            />
                        ) : (
                            <DarkModeIcon sx={{ fontSize: 17 }} />
                        )}
                    </IconButton>
                </Tooltip>

                {session ? (
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ ml: 0.5 }}>
                        <Avatar
                            src={session.user?.image || undefined}
                            alt={session.user?.name || 'User'}
                            sx={{ width: 28, height: 28 }}
                        />
                        <Tooltip title="Sign out" arrow>
                            <IconButton onClick={() => signOut()} size="small" sx={iconButtonSx}>
                                <LogoutIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                ) : (
                    <Tooltip title="Sign in" arrow>
                        <IconButton onClick={() => signIn('google')} size="small" sx={{ ...iconButtonSx, ml: 0.5 }}>
                            <LoginIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                    </Tooltip>
                )}
            </Stack>
        </Box>
    );
}

export default Header;
