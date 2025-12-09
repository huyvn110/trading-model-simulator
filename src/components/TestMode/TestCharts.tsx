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
} from '@mui/material';
import { useTestSessionStore } from '@/store/testSessionStore';
import { useFactorStore } from '@/store/factorStore';
import { BestModelSummary } from './BestModelSummary';

export function TestCharts() {
    const { currentSession, getCurrentSessionStats, getTotalStats } = useTestSessionStore();
    const { factors } = useFactorStore();

    // Create name resolver function
    const getFactorName = (id: string) => {
        const factor = factors.find((f) => f.id === id);
        return factor?.name || 'Unknown';
    };

    const stats = getCurrentSessionStats(getFactorName);
    const totals = getTotalStats();
    const measurementMode = currentSession?.measurementMode || 'RR';

    // Sort by win rate for display
    const sortedStats = [...stats].sort((a, b) => b.winRate - a.winRate);

    if (!currentSession || stats.length === 0) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    Thống kê
                </Typography>
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <Typography variant="body1">
                        Chưa có dữ liệu. Ghi trade để xem thống kê.
                    </Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <Stack spacing={3}>
            {/* Best Model Summary - Đặt lên đầu */}
            <BestModelSummary />

            <Paper
                elevation={0}
                sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                    Thống Kê Chi Tiết
                </Typography>

                <Stack spacing={6}>
                    {/* 1. So sánh theo số Factor */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            📊 So sánh theo Số Factor
                        </Typography>
                        <Stack spacing={2} sx={{ mt: 2 }}>
                            {(() => {
                                const grouped = stats.reduce((acc, stat) => {
                                    const count = stat.factorIds?.length || 0;
                                    if (!acc[count]) {
                                        acc[count] = { models: [], totalWins: 0, totalTrades: 0, totalValue: 0 };
                                    }
                                    acc[count].models.push(stat);
                                    acc[count].totalWins += stat.wins;
                                    acc[count].totalTrades += stat.totalTrades;
                                    acc[count].totalValue += stat.totalValue;
                                    return acc;
                                }, {} as Record<number, { models: typeof stats; totalWins: number; totalTrades: number; totalValue: number }>);

                                return Object.entries(grouped)
                                    .sort(([a], [b]) => Number(a) - Number(b))
                                    .map(([count, data]) => {
                                        const avgWinRate = data.totalTrades > 0 ? (data.totalWins / data.totalTrades) * 100 : 0;
                                        const avgValue = data.totalValue / data.models.length;

                                        return (
                                            <Box
                                                key={count}
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 1,
                                                    bgcolor: 'grey.50',
                                                    border: '1px solid',
                                                    borderColor: 'grey.200',
                                                }}
                                            >
                                                <Stack direction="row" alignItems="center" spacing={2}>
                                                    <Box
                                                        sx={{
                                                            minWidth: 60,
                                                            height: 60,
                                                            borderRadius: 1,
                                                            bgcolor: 'primary.main',
                                                            color: 'white',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexDirection: 'column',
                                                        }}
                                                    >
                                                        <Typography variant="h5" fontWeight={700}>
                                                            {count}
                                                        </Typography>
                                                        <Typography variant="caption" fontSize="0.65rem">
                                                            Factor
                                                        </Typography>
                                                    </Box>

                                                    <Box sx={{ flex: 1 }}>
                                                        <Stack spacing={1.5}>
                                                            <Stack direction="row" spacing={4}>
                                                                <Box>
                                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                                        Models
                                                                    </Typography>
                                                                    <Typography variant="h6" fontWeight={600}>
                                                                        {data.models.length}
                                                                    </Typography>
                                                                </Box>
                                                                <Box>
                                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                                        Trades
                                                                    </Typography>
                                                                    <Typography variant="h6" fontWeight={600}>
                                                                        {data.totalTrades}
                                                                    </Typography>
                                                                </Box>
                                                                <Box>
                                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                                        Avg Win Rate
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="h6"
                                                                        fontWeight={600}
                                                                        color={avgWinRate >= 50 ? 'success.main' : 'error.main'}
                                                                    >
                                                                        {avgWinRate.toFixed(1)}%
                                                                    </Typography>
                                                                </Box>
                                                                <Box>
                                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                                        Avg {measurementMode}
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="h6"
                                                                        fontWeight={600}
                                                                        color={avgValue >= 0 ? 'success.main' : 'error.main'}
                                                                    >
                                                                        {avgValue >= 0 ? '+' : ''}{avgValue.toFixed(2)}
                                                                    </Typography>
                                                                </Box>
                                                            </Stack>
                                                        </Stack>
                                                    </Box>
                                                </Stack>
                                            </Box>
                                        );
                                    });
                            })()}
                        </Stack>
                    </Box>

                    {/* 2. Win/Loss theo Model */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            📊 Win/Loss theo Model
                        </Typography>
                        <Stack spacing={1.5} sx={{ mt: 2 }}>
                            {sortedStats.map((stat, index) => {
                                const maxTrades = Math.max(...stats.map(s => s.totalTrades));
                                return (
                                    <Box key={stat.modelKey}>
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    minWidth: 25,
                                                    fontWeight: 600,
                                                    color: index === 0 ? 'success.main' : 'text.secondary',
                                                }}
                                            >
                                                #{index + 1}
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                sx={{ minWidth: 150, fontWeight: 500 }}
                                                noWrap
                                            >
                                                {stat.factorNames.join(' + ')}
                                            </Typography>

                                            <Box sx={{ flex: 1 }}>
                                                <Stack direction="row" spacing={0.5} sx={{ height: 30 }}>
                                                    {/* Win bar */}
                                                    <Box
                                                        sx={{
                                                            width: `${(stat.wins / maxTrades) * 100}%`,
                                                            bgcolor: 'success.main',
                                                            borderRadius: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            minWidth: stat.wins > 0 ? 30 : 0,
                                                        }}
                                                    >
                                                        {stat.wins > 0 && (
                                                            <Typography variant="caption" color="white" fontWeight={600}>
                                                                {stat.wins}
                                                            </Typography>
                                                        )}
                                                    </Box>

                                                    {/* Loss bar */}
                                                    <Box
                                                        sx={{
                                                            width: `${(stat.losses / maxTrades) * 100}%`,
                                                            bgcolor: 'error.main',
                                                            borderRadius: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            minWidth: stat.losses > 0 ? 30 : 0,
                                                        }}
                                                    >
                                                        {stat.losses > 0 && (
                                                            <Typography variant="caption" color="white" fontWeight={600}>
                                                                {stat.losses}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Stack>
                                            </Box>

                                            <Typography variant="body2" fontWeight={600} sx={{ minWidth: 60 }}>
                                                {stat.winRate.toFixed(1)}%
                                            </Typography>
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>

                    {/* 3. Hiệu Quả Giao Dịch */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            💰 Hiệu Quả Giao Dịch
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                            Công thức: RR = Trung bình Win / Trung bình Loss
                        </Typography>
                        <Stack spacing={1.5}>
                            {(() => {
                                // Calculate RR for each model
                                const statsWithRR = sortedStats.map(stat => {
                                    const avgWin = stat.wins > 0 ? stat.winValue / stat.wins : 0;
                                    const avgLoss = stat.losses > 0 ? Math.abs(stat.lossValue) / stat.losses : 1;
                                    const realRR = avgLoss > 0 ? avgWin / avgLoss : avgWin;
                                    return { ...stat, realRR };
                                }).sort((a, b) => b.realRR - a.realRR);

                                const maxRR = Math.max(...statsWithRR.map(s => s.realRR));

                                return statsWithRR.map((stat, index) => {
                                    const percentage = maxRR > 0 ? (stat.realRR / maxRR) * 100 : 0;

                                    return (
                                        <Box key={stat.modelKey}>
                                            <Stack direction="row" alignItems="center" spacing={2}>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        minWidth: 25,
                                                        fontWeight: 600,
                                                        color: index === 0 ? 'success.main' : 'text.secondary',
                                                    }}
                                                >
                                                    #{index + 1}
                                                </Typography>

                                                <Typography
                                                    variant="body2"
                                                    sx={{ minWidth: 150, fontWeight: 500 }}
                                                    noWrap
                                                >
                                                    {stat.factorNames.join(' + ')}
                                                </Typography>

                                                <Box sx={{ flex: 1, position: 'relative' }}>
                                                    <Box
                                                        sx={{
                                                            width: `${percentage}%`,
                                                            height: 30,
                                                            bgcolor: stat.realRR >= 1 ? 'success.main' : 'warning.main',
                                                            borderRadius: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            px: 1,
                                                            minWidth: 50,
                                                        }}
                                                    >
                                                        <Typography variant="caption" color="white" fontWeight={600}>
                                                            {stat.realRR.toFixed(2)}R
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    );
                                });
                            })()}
                        </Stack>
                    </Box>

                    {/* 4. Kỳ Vọng (Expectancy) */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            🎯 Kỳ Vọng (Expectancy)
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                            Công thức: Kỳ Vọng = (WinRate × Avg RR) - LossRate
                        </Typography>
                        <Stack spacing={1.5}>
                            {sortedStats.map((stat, index) => {
                                const winRate = stat.winRate / 100;
                                const lossRate = 1 - winRate;
                                const avgRR = stat.totalTrades > 0 ? stat.totalValue / stat.wins : 0;
                                const expectancy = (winRate * Math.abs(avgRR)) - lossRate;
                                const maxExpectancy = Math.max(...sortedStats.map(s => {
                                    const wr = s.winRate / 100;
                                    const lr = 1 - wr;
                                    const ar = s.totalTrades > 0 && s.wins > 0 ? s.totalValue / s.wins : 0;
                                    return Math.abs((wr * Math.abs(ar)) - lr);
                                }));
                                const percentage = maxExpectancy > 0 ? (Math.abs(expectancy) / maxExpectancy) * 100 : 0;

                                return (
                                    <Box key={stat.modelKey}>
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    minWidth: 25,
                                                    fontWeight: 600,
                                                    color: index === 0 ? 'success.main' : 'text.secondary',
                                                }}
                                            >
                                                #{index + 1}
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                sx={{ minWidth: 150, fontWeight: 500 }}
                                                noWrap
                                            >
                                                {stat.factorNames.join(' + ')}
                                            </Typography>

                                            <Box sx={{ flex: 1, position: 'relative' }}>
                                                <Box
                                                    sx={{
                                                        width: `${percentage}%`,
                                                        height: 30,
                                                        bgcolor: expectancy >= 0 ? 'info.main' : 'warning.main',
                                                        borderRadius: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        px: 1,
                                                        minWidth: 50,
                                                    }}
                                                >
                                                    <Typography variant="caption" color="white" fontWeight={600}>
                                                        {expectancy >= 0 ? '+' : ''}{expectancy.toFixed(3)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>

                    {/* 5. Bảng Xếp Hạng Model (Table) */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            📋 Bảng Xếp Hạng Model
                        </Typography>
                        <TableContainer sx={{ mt: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, width: 40 }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Model</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Trades</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>{measurementMode}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, minWidth: 150 }}>Win Rate</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedStats.map((stat, index) => (
                                        <TableRow
                                            key={stat.modelKey}
                                            sx={{
                                                bgcolor: index === 0 ? 'primary.50' : 'transparent',
                                            }}
                                        >
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={600}
                                                    color={index === 0 ? 'primary.main' : 'text.secondary'}
                                                >
                                                    #{index + 1}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                    {stat.factorNames.map((name) => (
                                                        <Chip
                                                            key={name}
                                                            label={name}
                                                            size="small"
                                                            sx={{
                                                                fontSize: '0.75rem',
                                                                height: 24,
                                                                bgcolor: index === 0 ? 'primary.main' : 'primary.light',
                                                                color: 'white',
                                                            }}
                                                        />
                                                    ))}
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography variant="body2" fontWeight={500}>
                                                    {stat.totalTrades}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={600}
                                                    color={stat.totalValue >= 0 ? 'success.main' : 'error.main'}
                                                >
                                                    {stat.totalValue >= 0 ? '+' : ''}{stat.totalValue.toFixed(2)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{ flex: 1 }}>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={stat.winRate}
                                                            sx={{
                                                                height: 8,
                                                                borderRadius: 4,
                                                                bgcolor: 'grey.200',
                                                                '& .MuiLinearProgress-bar': {
                                                                    borderRadius: 4,
                                                                    bgcolor:
                                                                        stat.winRate >= 60
                                                                            ? 'success.main'
                                                                            : stat.winRate >= 40
                                                                                ? 'warning.main'
                                                                                : 'error.main',
                                                                },
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={600}
                                                        sx={{ minWidth: 50, textAlign: 'right' }}
                                                    >
                                                        {stat.winRate.toFixed(1)}%
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Stack>
            </Paper>
        </Stack>
    );
}

export default TestCharts;
