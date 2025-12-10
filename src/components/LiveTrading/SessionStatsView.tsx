'use client';

import React, { useMemo, memo } from 'react';
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
import { LiveSession } from '@/types';

// Dark theme for premium look
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        background: { default: '#0f172a', paper: '#1e293b' },
    },
});

// Section title style
const sectionTitleStyle = {
    background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: 700,
    fontSize: '1rem',
};

// Gold text style
const goldTextStyle = {
    background: 'linear-gradient(to right, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0px 1px 3px rgba(0,0,0,0.3)',
};

interface SessionStatsViewProps {
    session: LiveSession;
}

function SessionStatsViewComponent({ session }: SessionStatsViewProps) {
    const measurementMode = session.measurementMode || 'RR';

    // Calculate stats from session trades
    const stats = useMemo(() => {
        const modelStats = session.trades.reduce((acc, trade) => {
            const key = trade.modelId;
            if (!acc[key]) {
                acc[key] = {
                    modelId: trade.modelId,
                    modelName: trade.modelName,
                    totalTrades: 0,
                    wins: 0,
                    losses: 0,
                    totalProfit: 0,
                    totalLoss: 0,
                };
            }
            acc[key].totalTrades++;
            if (trade.result === 'win') {
                acc[key].wins++;
                acc[key].totalProfit += trade.measurementValue;
            } else {
                acc[key].losses++;
                acc[key].totalLoss += trade.measurementValue;
            }
            return acc;
        }, {} as Record<string, any>);

        return Object.values(modelStats).map((stat: any) => ({
            ...stat,
            winRate: stat.totalTrades > 0 ? (stat.wins / stat.totalTrades) * 100 : 0,
        }));
    }, [session.trades]);

    const sortedStats = useMemo(() => [...stats].sort((a, b) => b.winRate - a.winRate), [stats]);

    if (stats.length === 0) {
        return (
            <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                <Typography>Không có dữ liệu trades</Typography>
            </Box>
        );
    }

    const bestModel = sortedStats[0];
    const bestPL = bestModel.totalProfit - bestModel.totalLoss;

    const formatValue = (value: number) => {
        switch (measurementMode) {
            case 'RR': return `${value.toFixed(2)}`;
            case '$': return `$${value.toFixed(0)}`;
            case '%': return `${value.toFixed(1)}%`;
        }
    };

    return (
        <Stack spacing={3}>
            {/* TOP PERFORMER */}
            <Paper
                elevation={6}
                sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 4,
                    background: 'radial-gradient(circle at 0% 0%, #1e293b 0%, #0f172a 100%)',
                    padding: '1px',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0, right: 0, bottom: 0, left: 0,
                        borderRadius: 4, margin: '-1px', zIndex: -1,
                        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(15, 23, 42, 0.5) 50%, rgba(255, 215, 0, 0.1) 100%)',
                    },
                }}
            >
                <Box sx={{
                    bgcolor: '#0f172a',
                    background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    borderRadius: 3.5, p: 3,
                }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Box sx={{
                                width: 50, height: 50, borderRadius: 2,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%)',
                                border: '1px solid rgba(255, 215, 0, 0.3)',
                            }}>
                                <Typography sx={{ fontSize: 28 }}>🏆</Typography>
                            </Box>
                            <Box>
                                <Typography variant="overline" sx={{ color: '#94a3b8', letterSpacing: 2 }}>TOP PERFORMER</Typography>
                                <Typography variant="h5" sx={{ ...goldTextStyle, fontWeight: 800 }}>Model Tốt Nhất</Typography>
                            </Box>
                        </Stack>
                        <Box sx={{
                            px: 2.5, py: 1, borderRadius: 50,
                            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)',
                            border: '1px solid rgba(255, 215, 0, 0.2)',
                        }}>
                            <Typography sx={{ fontWeight: 700, ...goldTextStyle }}>{bestModel.modelName}</Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={2}>
                        <Box sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>WIN RATE</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#10b981' }}>{bestModel.winRate.toFixed(1)}%</Typography>
                        </Box>
                        <Box sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>{measurementMode}</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: bestPL >= 0 ? '#4ade80' : '#f87171' }}>
                                {bestPL >= 0 ? '+' : ''}{formatValue(bestPL)}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>TRADES</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#c4b5fd' }}>{bestModel.totalTrades}</Typography>
                        </Box>
                        <Box sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>W / L</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                <Box component="span" sx={{ color: '#4ade80' }}>{bestModel.wins}</Box>
                                <Box component="span" sx={{ color: '#64748b', mx: 0.5 }}>/</Box>
                                <Box component="span" sx={{ color: '#f87171' }}>{bestModel.losses}</Box>
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
            </Paper>

            {/* Stats Charts */}
            <ThemeProvider theme={darkTheme}>
                <Paper elevation={6} sx={{
                    borderRadius: 4,
                    background: 'radial-gradient(circle at 0% 0%, #1e293b 0%, #0f172a 100%)',
                    padding: '1px',
                    '&::before': {
                        content: '""', position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
                        borderRadius: 4, margin: '-1px', zIndex: -1,
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(15, 23, 42, 0.5) 50%, rgba(139, 92, 246, 0.2) 100%)',
                    },
                }}>
                    <Box sx={{ bgcolor: '#0f172a', borderRadius: 3.5, p: 3 }}>
                        <Stack spacing={4}>
                            {/* Hiệu Quả Giao Dịch */}
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                                    <Box sx={{ width: 28, height: 28, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(74, 222, 128, 0.1)' }}>
                                        <Typography sx={{ fontSize: 14 }}>💰</Typography>
                                    </Box>
                                    <Typography sx={sectionTitleStyle}>Hiệu Quả Giao Dịch</Typography>
                                </Stack>
                                <Stack spacing={1}>
                                    {(() => {
                                        const statsWithRR = sortedStats.map(stat => {
                                            const avgWin = stat.wins > 0 ? stat.totalProfit / stat.wins : 0;
                                            const avgLoss = stat.losses > 0 ? Math.abs(stat.totalLoss) / stat.losses : 1;
                                            return { ...stat, realRR: avgLoss > 0 ? avgWin / avgLoss : avgWin };
                                        }).sort((a, b) => b.realRR - a.realRR);
                                        const maxRR = Math.max(...statsWithRR.map(s => s.realRR));

                                        return statsWithRR.map((stat, i) => (
                                            <Box key={stat.modelId} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                                    <Typography sx={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{stat.modelName}</Typography>
                                                    <Typography sx={{ fontWeight: 700, color: stat.realRR >= 1 ? '#4ade80' : '#fb7185' }}>{stat.realRR.toFixed(2)}R</Typography>
                                                </Stack>
                                                <Box sx={{ width: '100%', height: 4, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                                                    <Box sx={{ width: `${maxRR > 0 ? (stat.realRR / maxRR) * 100 : 0}%`, height: '100%', bgcolor: stat.realRR >= 1 ? '#4ade80' : '#fb7185', borderRadius: 2 }} />
                                                </Box>
                                            </Box>
                                        ));
                                    })()}
                                </Stack>
                            </Box>

                            {/* Kỳ Vọng */}
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                                    <Box sx={{ width: 28, height: 28, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(96, 165, 250, 0.1)' }}>
                                        <Typography sx={{ fontSize: 14 }}>🎯</Typography>
                                    </Box>
                                    <Typography sx={sectionTitleStyle}>Kỳ Vọng</Typography>
                                </Stack>
                                <Stack spacing={1}>
                                    {sortedStats.map((stat, i) => {
                                        const wr = stat.winRate / 100;
                                        const avgWin = stat.wins > 0 ? stat.totalProfit / stat.wins : 0;
                                        const exp = (wr * Math.abs(avgWin)) - (1 - wr);
                                        const maxExp = Math.max(...sortedStats.map(s => {
                                            const w = s.winRate / 100;
                                            const a = s.wins > 0 ? s.totalProfit / s.wins : 0;
                                            return Math.abs((w * Math.abs(a)) - (1 - w));
                                        }));
                                        return (
                                            <Box key={stat.modelId} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                                    <Typography sx={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{stat.modelName}</Typography>
                                                    <Typography sx={{ fontWeight: 700, color: exp >= 0 ? '#60a5fa' : '#fb7185' }}>{exp >= 0 ? '+' : ''}{exp.toFixed(2)}</Typography>
                                                </Stack>
                                                <Box sx={{ width: '100%', height: 4, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                                                    <Box sx={{ width: `${maxExp > 0 ? (Math.abs(exp) / maxExp) * 100 : 0}%`, height: '100%', bgcolor: exp >= 0 ? '#60a5fa' : '#fb7185', borderRadius: 2 }} />
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </Box>

                            {/* Bảng Xếp Hạng */}
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                                    <Typography sx={{ fontSize: 16 }}>📋</Typography>
                                    <Typography sx={sectionTitleStyle}>Bảng Xếp Hạng</Typography>
                                </Stack>
                                <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)' }}>
                                                <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }}>#</TableCell>
                                                <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }}>Model</TableCell>
                                                <TableCell align="center" sx={{ color: '#94a3b8', fontWeight: 600 }}>Trades</TableCell>
                                                <TableCell align="center" sx={{ color: '#94a3b8', fontWeight: 600 }}>W/L</TableCell>
                                                <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 600 }}>Win Rate</TableCell>
                                                <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 600 }}>P/L</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {sortedStats.map((stat, i) => (
                                                <TableRow key={stat.modelId}>
                                                    <TableCell sx={{ color: i === 0 ? '#6366f1' : '#64748b', fontWeight: 700 }}>#{i + 1}</TableCell>
                                                    <TableCell>
                                                        <Chip label={stat.modelName} size="small" sx={{ bgcolor: i === 0 ? '#6366f1' : 'rgba(99,102,241,0.25)', color: 'white' }} />
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ color: '#f1f5f9' }}>{stat.totalTrades}</TableCell>
                                                    <TableCell align="center">
                                                        <Stack direction="row" spacing={0.5} justifyContent="center">
                                                            <Chip label={stat.wins} size="small" sx={{ minWidth: 24, bgcolor: '#22c55e', color: 'white' }} />
                                                            <Chip label={stat.losses} size="small" sx={{ minWidth: 24, bgcolor: '#ef4444', color: 'white' }} />
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                            <Box sx={{ flex: 1 }}>
                                                                <LinearProgress variant="determinate" value={stat.winRate} sx={{
                                                                    height: 5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)',
                                                                    '& .MuiLinearProgress-bar': { bgcolor: stat.winRate >= 60 ? '#4ade80' : stat.winRate >= 40 ? '#60a5fa' : '#f87171' }
                                                                }} />
                                                            </Box>
                                                            <Typography sx={{ fontWeight: 600, color: '#f1f5f9', minWidth: 40 }}>{stat.winRate.toFixed(0)}%</Typography>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography sx={{ fontWeight: 600, color: stat.totalProfit - stat.totalLoss >= 0 ? '#4ade80' : '#f87171' }}>
                                                            {stat.totalProfit - stat.totalLoss >= 0 ? '+' : ''}{formatValue(stat.totalProfit - stat.totalLoss)}
                                                        </Typography>
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

export const SessionStatsView = memo(SessionStatsViewComponent);
export default SessionStatsView;
