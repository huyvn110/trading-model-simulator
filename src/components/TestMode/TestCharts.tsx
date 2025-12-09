'use client';

import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Stack,
    Chip,
    LinearProgress,
} from '@mui/material';
import { useTestSessionStore } from '@/store/testSessionStore';
import { useFactorStore } from '@/store/factorStore';

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
                    Biểu đồ
                </Typography>
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <Typography variant="body1">
                        Chưa có dữ liệu. Ghi trade để xem biểu đồ.
                    </Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <>
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
                    Phân Tích Biểu Đồ
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

                    {/* 3. Giá trị RR theo Model */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            💰 Giá trị {measurementMode} theo Model
                        </Typography>
                        <Stack spacing={1.5} sx={{ mt: 2 }}>
                            {sortedStats.map((stat, index) => {
                                const maxValue = Math.max(...stats.map(s => Math.abs(s.totalValue)));
                                const percentage = maxValue > 0 ? (Math.abs(stat.totalValue) / maxValue) * 100 : 0;

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
                                                        bgcolor: stat.totalValue >= 0 ? 'success.main' : 'error.main',
                                                        borderRadius: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        px: 1,
                                                        minWidth: 40,
                                                    }}
                                                >
                                                    <Typography variant="caption" color="white" fontWeight={600}>
                                                        {stat.totalValue >= 0 ? '+' : ''}{stat.totalValue.toFixed(2)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>

                    {/* 4. Xếp hạng Win Rate */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            🏆 Xếp hạng Win Rate
                        </Typography>
                        <Stack spacing={1} sx={{ mt: 2 }}>
                            {sortedStats.map((stat, index) => (
                                <Box
                                    key={stat.modelKey}
                                    sx={{
                                        p: 2,
                                        borderRadius: 1,
                                        bgcolor: index === 0 ? 'success.50' : 'grey.50',
                                        border: '1px solid',
                                        borderColor: index === 0 ? 'success.main' : 'grey.200',
                                    }}
                                >
                                    <Stack spacing={1}>
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    minWidth: 35,
                                                    fontWeight: 700,
                                                    color: index === 0 ? 'success.main' : 'text.secondary',
                                                }}
                                            >
                                                #{index + 1}
                                            </Typography>

                                            <Chip
                                                label={`${stat.factorIds?.length || 0}F`}
                                                size="small"
                                                color={index === 0 ? 'success' : 'default'}
                                                sx={{ fontWeight: 600, minWidth: 45 }}
                                            />

                                            <Typography variant="body1" fontWeight={500} sx={{ flex: 1 }}>
                                                {stat.factorNames.join(' + ')}
                                            </Typography>

                                            <Typography variant="caption" color="text.secondary">
                                                {stat.totalTrades} trades
                                            </Typography>
                                        </Stack>

                                        <Stack direction="row" spacing={3} alignItems="center">
                                            <Box sx={{ flex: 1 }}>
                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Win Rate
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={600}
                                                        color={stat.winRate >= 50 ? 'success.main' : 'error.main'}
                                                    >
                                                        {stat.winRate.toFixed(1)}%
                                                    </Typography>
                                                </Stack>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={stat.winRate}
                                                    sx={{
                                                        height: 8,
                                                        borderRadius: 1,
                                                        bgcolor: 'grey.200',
                                                        '& .MuiLinearProgress-bar': {
                                                            bgcolor: stat.winRate >= 50 ? 'success.main' : 'error.main',
                                                        },
                                                    }}
                                                />
                                            </Box>

                                            <Box sx={{ minWidth: 100, textAlign: 'right' }}>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {measurementMode}
                                                </Typography>
                                                <Typography
                                                    variant="h6"
                                                    fontWeight={600}
                                                    color={stat.totalValue >= 0 ? 'success.main' : 'error.main'}
                                                >
                                                    {stat.totalValue >= 0 ? '+' : ''}{stat.totalValue.toFixed(2)}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Stack>
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                </Stack>
            </Paper>
        </>
    );
}

export default TestCharts;
