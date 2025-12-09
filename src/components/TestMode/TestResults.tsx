'use client';

import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
    Chip,
    Stack,
} from '@mui/material';
import { useTestSessionStore } from '@/store/testSessionStore';
import { useFactorStore } from '@/store/factorStore';

export function TestResults() {
    const { currentSession, getCurrentSessionStats, getTotalStats } = useTestSessionStore();
    const { factors } = useFactorStore();

    // Create name resolver function
    const getFactorName = (id: string) => {
        const factor = factors.find((f) => f.id === id);
        return factor?.name || 'Unknown';
    };

    const rawStats = getCurrentSessionStats(getFactorName);
    // Sort by win rate (highest first)
    const stats = [...rawStats].sort((a, b) => b.winRate - a.winRate);
    const totals = getTotalStats();
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

            {/* Summary Cards - Best Model Info */}
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Box
                    sx={{
                        flex: 1.5,
                        p: 2,
                        borderRadius: 1.5,
                        bgcolor: 'primary.50',
                        border: '2px solid',
                        borderColor: 'primary.main',
                    }}
                >
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        🏆 Model Hiệu Quả Nhất
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="primary.main" noWrap>
                        {stats[0]?.factorNames.join(' + ') || 'N/A'}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        flex: 1,
                        p: 2,
                        borderRadius: 1.5,
                        bgcolor: 'success.50',
                        textAlign: 'center',
                    }}
                >
                    <Typography
                        variant="h4"
                        fontWeight={600}
                        color={stats[0]?.winRate >= 50 ? 'success.main' : 'error.main'}
                    >
                        {stats[0]?.winRate.toFixed(1) || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Win Rate
                    </Typography>
                </Box>
                <Box
                    sx={{
                        flex: 1,
                        p: 2,
                        borderRadius: 1.5,
                        bgcolor: stats[0]?.totalValue >= 0 ? 'success.50' : 'error.50',
                        textAlign: 'center',
                    }}
                >
                    <Typography
                        variant="h4"
                        fontWeight={600}
                        color={stats[0]?.totalValue >= 0 ? 'success.main' : 'error.main'}
                    >
                        {stats[0] ? (stats[0].totalValue >= 0 ? '+' : '') + formatValue(stats[0].totalValue) : '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {measurementMode} của Model #1
                    </Typography>
                </Box>
            </Stack>

            {/* Model Stats Table */}
            <TableContainer>
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
                        {stats.map((stat, index) => (
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
                                        {stat.totalValue >= 0 ? '+' : ''}{formatValue(stat.totalValue)}
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
        </Paper>
    );
}

export default TestResults;
