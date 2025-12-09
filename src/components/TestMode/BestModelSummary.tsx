'use client';

import React from 'react';
import { Box, Paper, Typography, Stack, useTheme } from '@mui/material';
import {
    EmojiEvents as TrophyIcon,
    TrendingUp as TrendingIcon,
    Timeline as TimelineIcon,
    ShowChart as ChartIcon,
} from '@mui/icons-material';
import { useTestSessionStore } from '@/store/testSessionStore';
import { useFactorStore } from '@/store/factorStore';

export function BestModelSummary() {
    const { currentSession, getCurrentSessionStats } = useTestSessionStore();
    const { factors } = useFactorStore();

    const getFactorName = (id: string) => {
        const factor = factors.find((f) => f.id === id);
        return factor?.name || 'Unknown';
    };

    const rawStats = getCurrentSessionStats(getFactorName);
    const stats = [...rawStats].sort((a, b) => b.winRate - a.winRate);
    const measurementMode = currentSession?.measurementMode || 'RR';

    const formatValue = (value: number) => {
        switch (measurementMode) {
            case 'RR':
                return `${value.toFixed(2)}`;
            case '$':
                return `$${value.toFixed(0)}`;
            case '%':
                return `${value.toFixed(1)}%`;
        }
    };

    if (!currentSession || stats.length === 0) {
        return null;
    }

    const bestModel = stats[0];
    const isPositive = bestModel.totalValue >= 0;

    // Gold Gradient Text Style
    const goldTextStyle = {
        background: 'linear-gradient(to right, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0px 1px 3px rgba(0,0,0,0.3)',
    };

    return (
        <Paper
            elevation={6}
            sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 4,
                // Deep rich background with radial glow for depth
                background: 'radial-gradient(circle at 0% 0%, #1e293b 0%, #0f172a 100%)',
                p: 3.5,
                // Premium border with subtle gradient
                padding: '1px',
                backgroundClip: 'padding-box',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    borderRadius: 4,
                    margin: '-1px',
                    zIndex: -1,
                    // Gold to Dark Blue gradient border
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(15, 23, 42, 0.5) 50%, rgba(255, 215, 0, 0.1) 100%)',
                },
                boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.7)', // Deeper shadow
            }}
        >
            {/* Inner Content Container */}
            <Box sx={{
                bgcolor: '#0f172a', // Fallback
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)', // Glassy dark feel
                borderRadius: 3.5,
                p: 3,
                height: '100%',
                backdropFilter: 'blur(20px)',
            }}>
                {/* Decorative Glows */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -100,
                        right: -100,
                        width: 300,
                        height: 300,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.08) 0%, rgba(0,0,0,0) 70%)',
                        pointerEvents: 'none',
                    }}
                />

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    {/* Header Section */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={3} sx={{ mb: 4 }}>
                        <Stack direction="row" alignItems="center" spacing={2.5}>
                            {/* Trophy Icon Box */}
                            <Box
                                sx={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%)',
                                    border: '1px solid rgba(255, 215, 0, 0.3)',
                                    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.15), inset 0 1px 0 rgba(255,215,0,0.2)',
                                }}
                            >
                                <Typography sx={{ fontSize: 36, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                                    🏆
                                </Typography>
                            </Box>

                            <Box>
                                <Typography
                                    variant="overline"
                                    sx={{
                                        color: '#94a3b8',
                                        letterSpacing: 2,
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        display: 'block',
                                        lineHeight: 1.2,
                                        mb: 0.5,
                                    }}
                                >
                                    TOP PERFORMER
                                </Typography>
                                <Typography
                                    variant="h4"
                                    sx={{
                                        ...goldTextStyle,
                                        fontWeight: 800,
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    Model Tốt Nhất
                                </Typography>
                            </Box>
                        </Stack>

                        {/* Factor List Pill */}
                        <Box
                            sx={{
                                px: 3,
                                py: 1.2,
                                borderRadius: 50,
                                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)', // Dark gradient for contrast
                                border: '1px solid rgba(255, 215, 0, 0.2)', // Gold border
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontWeight: 700,
                                    ...goldTextStyle, // Apply the same gold gradient
                                    letterSpacing: 0.5,
                                }}
                            >
                                {bestModel.factorNames.join(' + ')}
                            </Typography>
                        </Box>
                    </Stack>

                    {/* Stats Grid */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        {/* Win Rate */}
                        <Box
                            sx={{
                                flex: 1,
                                p: 2.5,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                textAlign: 'center',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.15)',
                                },
                            }}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ mb: 1 }}>
                                <Typography sx={{ fontSize: 16 }}>📈</Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, letterSpacing: 0.5 }}>
                                    WIN RATE
                                </Typography>
                            </Stack>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981' }}>
                                {bestModel.winRate.toFixed(1)}%
                            </Typography>
                        </Box>

                        {/* RR / Value */}
                        <Box
                            sx={{
                                flex: 1,
                                p: 2.5,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                textAlign: 'center',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)',
                                },
                            }}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ mb: 1 }}>
                                <Typography sx={{ fontSize: 16 }}>💰</Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, letterSpacing: 0.5 }}>
                                    {measurementMode}
                                </Typography>
                            </Stack>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: isPositive ? '#4ade80' : '#f87171' }}>
                                {isPositive ? '+' : ''}{formatValue(bestModel.totalValue)}
                            </Typography>
                        </Box>

                        {/* Trades */}
                        <Box
                            sx={{
                                flex: 1,
                                p: 2.5,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.05) 100%)',
                                border: '1px solid rgba(168, 85, 247, 0.2)',
                                textAlign: 'center',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px rgba(168, 85, 247, 0.15)',
                                },
                            }}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ mb: 1 }}>
                                <Typography sx={{ fontSize: 16 }}>📊</Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, letterSpacing: 0.5 }}>
                                    TRADES
                                </Typography>
                            </Stack>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#c4b5fd' }}>
                                {bestModel.totalTrades}
                            </Typography>
                        </Box>

                        {/* W/L */}
                        <Box
                            sx={{
                                flex: 1,
                                p: 2.5,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.05) 100%)',
                                border: '1px solid rgba(251, 191, 36, 0.2)',
                                textAlign: 'center',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(251, 191, 36, 0.1) 100%)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px rgba(251, 191, 36, 0.15)',
                                },
                            }}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ mb: 1 }}>
                                <Typography sx={{ fontSize: 16 }}>⚖️</Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, letterSpacing: 0.5 }}>
                                    W / L
                                </Typography>
                            </Stack>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                <Box component="span" sx={{ color: '#4ade80' }}>{bestModel.wins}</Box>
                                <Box component="span" sx={{ color: '#64748b', mx: 1, fontSize: '0.8em' }}>/</Box>
                                <Box component="span" sx={{ color: '#f87171' }}>{bestModel.losses}</Box>
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
            </Box>
        </Paper>
    );
}

export default BestModelSummary;
