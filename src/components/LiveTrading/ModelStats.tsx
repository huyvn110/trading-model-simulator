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
} from '@mui/material';
import { useLiveSessionStore } from '@/store/liveSessionStore';

export function ModelStats() {
    const { getCurrentSessionStats, currentSession } = useLiveSessionStore();
    const stats = getCurrentSessionStats();
    const measurementMode = currentSession?.measurementMode || 'RR';

    const formatValue = (value: number) => {
        switch (measurementMode) {
            case 'RR':
                return `${value.toFixed(1)}R`;
            case '$':
                return `$${value.toFixed(0)}`;
            case '%':
                return `${value.toFixed(1)}%`;
        }
    };

    if (stats.length === 0) {
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
                    Model Stats
                </Typography>
                <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                    <Typography variant="body1">
                        Stats will appear after trades are recorded
                    </Typography>
                </Box>
            </Paper>
        );
    }

    const maxWinRate = Math.max(...stats.map((s) => s.winRate));

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
                Model Stats
            </Typography>

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Model</TableCell>
                            <TableCell align="center">Trades</TableCell>
                            <TableCell align="center">W/L</TableCell>
                            <TableCell align="right" sx={{ minWidth: 150 }}>Win Rate</TableCell>
                            <TableCell align="right">P/L</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stats.map((stat) => (
                            <TableRow key={stat.modelId}>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={500}>
                                        {stat.modelName}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <Chip
                                        label={stat.totalTrades}
                                        size="small"
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                        <Chip
                                            label={stat.wins}
                                            size="small"
                                            color="success"
                                            sx={{ minWidth: 32 }}
                                        />
                                        <Chip
                                            label={stat.losses}
                                            size="small"
                                            color="error"
                                            sx={{ minWidth: 32 }}
                                        />
                                    </Box>
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
                                            sx={{
                                                minWidth: 45,
                                                textAlign: 'right',
                                                color:
                                                    stat.winRate >= 60
                                                        ? 'success.main'
                                                        : stat.winRate >= 40
                                                            ? 'warning.main'
                                                            : 'error.main',
                                            }}
                                        >
                                            {stat.winRate.toFixed(0)}%
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography
                                        variant="body2"
                                        fontWeight={500}
                                        sx={{
                                            color:
                                                stat.totalProfit - stat.totalLoss >= 0
                                                    ? 'success.main'
                                                    : 'error.main',
                                        }}
                                    >
                                        {stat.totalProfit - stat.totalLoss >= 0 ? '+' : ''}
                                        {formatValue(stat.totalProfit - stat.totalLoss)}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}

export default ModelStats;
