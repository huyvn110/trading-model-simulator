'use client';

import React, { useState } from 'react';
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
    TableSortLabel,
    Chip,
    Stack,
    LinearProgress,
} from '@mui/material';
import { ModelStats } from '@/types';
import { useSimulationStore } from '@/store/simulationStore';

type SortField = 'modelKey' | 'count' | 'percentage';
type SortOrder = 'asc' | 'desc';

export function ResultsTable() {
    const { currentSession, state } = useSimulationStore();
    const [sortField, setSortField] = useState<SortField>('percentage');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const modelStats = currentSession?.modelStats || [];

    const sortedStats = [...modelStats].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortOrder === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }

        return sortOrder === 'asc'
            ? (aValue as number) - (bValue as number)
            : (bValue as number) - (aValue as number);
    });

    const maxPercentage = Math.max(...modelStats.map((s) => s.percentage), 0);

    if (!currentSession || modelStats.length === 0) {
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
                    Results
                </Typography>
                <Box
                    sx={{
                        py: 6,
                        textAlign: 'center',
                        color: 'text.secondary',
                    }}
                >
                    <Typography variant="body1">
                        {state === 'idle'
                            ? 'Start a simulation to see results'
                            : 'Waiting for iterations...'}
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Results
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {modelStats.length} unique models
                </Typography>
            </Box>

            <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>
                                <TableSortLabel
                                    active={sortField === 'modelKey'}
                                    direction={sortField === 'modelKey' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('modelKey')}
                                >
                                    Model
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">
                                <TableSortLabel
                                    active={sortField === 'count'}
                                    direction={sortField === 'count' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('count')}
                                >
                                    Count
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, minWidth: 200 }} align="right">
                                <TableSortLabel
                                    active={sortField === 'percentage'}
                                    direction={sortField === 'percentage' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('percentage')}
                                >
                                    Percentage
                                </TableSortLabel>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedStats.map((stat, index) => (
                            <TableRow
                                key={stat.modelKey}
                                className="fade-in"
                                sx={{
                                    '&:last-child td, &:last-child th': { border: 0 },
                                    animationDelay: `${index * 20}ms`,
                                }}
                            >
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
                                                    bgcolor: 'primary.light',
                                                    color: 'white',
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={500}>
                                        {stat.count}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ flex: 1 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={maxPercentage > 0 ? (stat.percentage / maxPercentage) * 100 : 0}
                                                sx={{
                                                    height: 8,
                                                    borderRadius: 4,
                                                    bgcolor: 'grey.200',
                                                    '& .MuiLinearProgress-bar': {
                                                        borderRadius: 4,
                                                        bgcolor:
                                                            stat.percentage === maxPercentage
                                                                ? 'success.main'
                                                                : 'primary.main',
                                                    },
                                                }}
                                            />
                                        </Box>
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                            sx={{ minWidth: 50, textAlign: 'right' }}
                                        >
                                            {stat.percentage.toFixed(1)}%
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

export default ResultsTable;
