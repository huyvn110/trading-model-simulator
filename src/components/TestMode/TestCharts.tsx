'use client';

import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Stack,
    Chip,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    ThemeProvider,
    createTheme,
} from '@mui/material';
import { useTestSessionStore } from '@/store/testSessionStore';
import { useFactorStore } from '@/store/factorStore';
import { BestModelSummary } from './BestModelSummary';

export function TestCharts() {
    const { currentSession, getCurrentSessionStats, getTotalStats } = useTestSessionStore();
    const { factors } = useFactorStore();

    const getFactorName = (id: string) => {
        const factor = factors.find((f) => f.id === id);
        return factor?.name || 'Unknown';
    };

    const stats = getCurrentSessionStats(getFactorName);
    const totals = getTotalStats();
    const measurementMode = currentSession?.measurementMode || 'RR';
    const sortedStats = [...stats].sort((a, b) => b.winRate - a.winRate);

    if (!currentSession || stats.length === 0) {
        return (
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>Thống kê</Typography>
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <Typography variant="body1">Chưa có dữ liệu. Ghi trade để xem thống kê.</Typography>
                </Box>
            </Paper>
        );
    }

    const darkTheme = createTheme({
        palette: {
            mode: 'dark',
            background: { default: '#0f172a', paper: '#1e293b' },
        },
    });

    // Section title style - gradient xanh thay vì vàng
    const sectionTitleStyle = {
        background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 700,
        fontSize: '1rem',
    };

    return (
        <Stack spacing={3}>
            <BestModelSummary />

            <ThemeProvider theme={darkTheme}>
                <Paper
                    elevation={6}
                    sx={{
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: 4,
                        background: 'radial-gradient(circle at 0% 0%, #1e293b 0%, #0f172a 100%)',
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
                            // Gradient xanh tím thay vì vàng
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(15, 23, 42, 0.5) 50%, rgba(139, 92, 246, 0.2) 100%)',
                        },
                        boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.7)',
                    }}
                >
                    {/* Inner Content */}
                    <Box sx={{
                        bgcolor: '#0f172a',
                        background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                        borderRadius: 3.5,
                        p: 3,
                        backdropFilter: 'blur(20px)',
                    }}>
                        {/* Decorative Glow - xanh thay vì vàng */}
                        <Box sx={{
                            position: 'absolute',
                            top: -100,
                            right: -100,
                            width: 300,
                            height: 300,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(0,0,0,0) 70%)',
                            pointerEvents: 'none',
                        }} />

                        {/* Header */}
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                            <Box sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                            }}>
                                <Typography sx={{ fontSize: 24 }}>📊</Typography>
                            </Box>
                            <Box>
                                <Typography variant="h5" sx={{
                                    fontWeight: 800,
                                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #94a3b8 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}>
                                    Thống Kê Chi Tiết
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                    Phân tích hiệu suất trading models
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack spacing={4}>
                            {/* 1. So sánh theo Số Factor */}
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                                    <Typography sx={{ fontSize: 18 }}>📈</Typography>
                                    <Typography sx={sectionTitleStyle}>So sánh theo Số Factor</Typography>
                                </Stack>
                                <Stack spacing={1.5}>
                                    {(() => {
                                        const grouped = stats.reduce((acc, stat) => {
                                            const count = stat.factorIds?.length || 0;
                                            if (!acc[count]) acc[count] = { models: [], totalWins: 0, totalTrades: 0, totalValue: 0 };
                                            acc[count].models.push(stat);
                                            acc[count].totalWins += stat.wins;
                                            acc[count].totalTrades += stat.totalTrades;
                                            acc[count].totalValue += stat.totalValue;
                                            return acc;
                                        }, {} as Record<number, { models: typeof stats; totalWins: number; totalTrades: number; totalValue: number }>);

                                        return Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([count, data]) => {
                                            const avgWinRate = data.totalTrades > 0 ? (data.totalWins / data.totalTrades) * 100 : 0;
                                            const avgValue = data.totalTrades > 0 ? data.totalValue / data.totalTrades : 0;
                                            return (
                                                <Box key={count} sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                                }}>
                                                    <Stack direction="row" alignItems="center" spacing={3}>
                                                        <Box sx={{
                                                            minWidth: 56,
                                                            height: 56,
                                                            borderRadius: 2,
                                                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                                                        }}>
                                                            <Typography sx={{ fontWeight: 800, color: 'white', fontSize: '1.25rem' }}>{count}</Typography>
                                                            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.6rem', textTransform: 'uppercase' }}>Factor</Typography>
                                                        </Box>
                                                        <Stack direction="row" spacing={4} sx={{ flex: 1 }}>
                                                            <Box>
                                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>Models</Typography>
                                                                <Typography sx={{ fontWeight: 600, color: '#f1f5f9' }}>{data.models.length}</Typography>
                                                            </Box>
                                                            <Box>
                                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>Trades</Typography>
                                                                <Typography sx={{ fontWeight: 600, color: '#f1f5f9' }}>{data.totalTrades}</Typography>
                                                            </Box>
                                                            <Box>
                                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>Avg Win Rate</Typography>
                                                                <Typography sx={{ fontWeight: 600, color: avgWinRate >= 50 ? '#4ade80' : '#f87171' }}>{avgWinRate.toFixed(1)}%</Typography>
                                                            </Box>
                                                            <Box>
                                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>Avg {measurementMode}</Typography>
                                                                <Typography sx={{ fontWeight: 600, color: avgValue >= 0 ? '#4ade80' : '#f87171' }}>{avgValue >= 0 ? '+' : ''}{avgValue.toFixed(1)}</Typography>
                                                            </Box>
                                                        </Stack>
                                                    </Stack>
                                                </Box>
                                            );
                                        });
                                    })()}
                                </Stack>
                            </Box>


                            {/* 3. Hiệu Quả Giao Dịch */}
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                                    <Typography sx={{ fontSize: 18 }}>💰</Typography>
                                    <Typography sx={sectionTitleStyle}>Hiệu Quả Giao Dịch</Typography>
                                </Stack>
                                <Stack spacing={1}>
                                    {(() => {
                                        const statsWithRR = sortedStats.map(stat => {
                                            const avgWin = stat.wins > 0 ? stat.winValue / stat.wins : 0;
                                            const avgLoss = stat.losses > 0 ? Math.abs(stat.lossValue) / stat.losses : 1;
                                            const realRR = avgLoss > 0 ? avgWin / avgLoss : avgWin;
                                            return { ...stat, realRR };
                                        }).sort((a, b) => b.realRR - a.realRR);
                                        const maxRR = Math.max(...statsWithRR.map(s => s.realRR));

                                        return statsWithRR.map((stat, index) => (
                                            <Stack key={stat.modelKey} direction="row" alignItems="center" spacing={2} sx={{ p: 1.5, borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                                                <Typography sx={{ minWidth: 28, fontWeight: 700, color: index === 0 ? '#4ade80' : '#64748b', fontSize: '0.85rem' }}>#{index + 1}</Typography>
                                                <Typography sx={{ minWidth: 140, fontWeight: 500, color: '#e2e8f0', fontSize: '0.9rem' }} noWrap>{stat.factorNames.join(' + ')}</Typography>
                                                <Box sx={{ flex: 1 }}>
                                                    <Box sx={{ width: `${maxRR > 0 ? (stat.realRR / maxRR) * 100 : 0}%`, height: 20, bgcolor: stat.realRR >= 1 ? '#4ade80' : '#f87171', borderRadius: 0.5, minWidth: 36, display: 'flex', alignItems: 'center', px: 1 }}>
                                                        <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>{stat.realRR.toFixed(1)}R</Typography>
                                                    </Box>
                                                </Box>
                                            </Stack>
                                        ));
                                    })()}
                                </Stack>
                            </Box>

                            {/* 4. Kỳ Vọng */}
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                                    <Typography sx={{ fontSize: 18 }}>🎯</Typography>
                                    <Typography sx={sectionTitleStyle}>Kỳ Vọng</Typography>
                                </Stack>
                                <Stack spacing={1}>
                                    {sortedStats.map((stat, index) => {
                                        const winRate = stat.winRate / 100;
                                        const avgRR = stat.wins > 0 ? stat.totalValue / stat.wins : 0;
                                        const expectancy = (winRate * Math.abs(avgRR)) - (1 - winRate);
                                        const maxExp = Math.max(...sortedStats.map(s => {
                                            const wr = s.winRate / 100;
                                            const ar = s.wins > 0 ? s.totalValue / s.wins : 0;
                                            return Math.abs((wr * Math.abs(ar)) - (1 - wr));
                                        }));
                                        return (
                                            <Stack key={stat.modelKey} direction="row" alignItems="center" spacing={2} sx={{ p: 1.5, borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                                                <Typography sx={{ minWidth: 28, fontWeight: 700, color: index === 0 ? '#4ade80' : '#64748b', fontSize: '0.85rem' }}>#{index + 1}</Typography>
                                                <Typography sx={{ minWidth: 140, fontWeight: 500, color: '#e2e8f0', fontSize: '0.9rem' }} noWrap>{stat.factorNames.join(' + ')}</Typography>
                                                <Box sx={{ flex: 1 }}>
                                                    <Box sx={{ width: `${maxExp > 0 ? (Math.abs(expectancy) / maxExp) * 100 : 0}%`, height: 20, bgcolor: expectancy >= 0 ? '#60a5fa' : '#f87171', borderRadius: 0.5, minWidth: 36, display: 'flex', alignItems: 'center', px: 1 }}>
                                                        <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>{expectancy >= 0 ? '+' : ''}{expectancy.toFixed(1)}</Typography>
                                                    </Box>
                                                </Box>
                                            </Stack>
                                        );
                                    })}
                                </Stack>
                            </Box>

                            {/* 5. Bảng Xếp Hạng */}
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                                    <Typography sx={{ fontSize: 18 }}>📋</Typography>
                                    <Typography sx={sectionTitleStyle}>Bảng Xếp Hạng Model</Typography>
                                </Stack>
                                <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)' }}>
                                                <TableCell sx={{ width: 40, color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>#</TableCell>
                                                <TableCell sx={{ color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Model</TableCell>
                                                <TableCell align="center" sx={{ color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Trades</TableCell>
                                                <TableCell align="center" sx={{ color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{measurementMode}</TableCell>
                                                <TableCell align="right" sx={{ minWidth: 140, color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Win Rate</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {sortedStats.map((stat, index) => (
                                                <TableRow key={stat.modelKey} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                                                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <Typography sx={{ fontWeight: 700, color: index === 0 ? '#6366f1' : '#64748b' }}>#{index + 1}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                            {stat.factorNames.map(name => (
                                                                <Chip key={name} label={name} size="small" sx={{ fontSize: '0.7rem', height: 22, bgcolor: index === 0 ? '#6366f1' : 'rgba(99,102,241,0.25)', color: 'white' }} />
                                                            ))}
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <Typography sx={{ color: '#f1f5f9' }}>{stat.totalTrades}</Typography>
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <Typography sx={{ fontWeight: 600, color: stat.totalValue >= 0 ? '#4ade80' : '#f87171' }}>{stat.totalValue >= 0 ? '+' : ''}{stat.totalValue.toFixed(1)}</Typography>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                            <Box sx={{ flex: 1 }}>
                                                                <LinearProgress variant="determinate" value={stat.winRate} sx={{
                                                                    height: 6,
                                                                    borderRadius: 3,
                                                                    bgcolor: 'rgba(255,255,255,0.1)',
                                                                    '& .MuiLinearProgress-bar': {
                                                                        borderRadius: 3,
                                                                        bgcolor: stat.winRate >= 60 ? '#4ade80' : stat.winRate >= 40 ? '#60a5fa' : '#f87171',
                                                                    }
                                                                }} />
                                                            </Box>
                                                            <Typography sx={{ fontWeight: 600, minWidth: 45, color: '#f1f5f9' }}>{stat.winRate.toFixed(1)}%</Typography>
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Stack>
                    </Box>
                </Paper>
            </ThemeProvider>
        </Stack>
    );
}

export default TestCharts;
