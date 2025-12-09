'use client';

import React from 'react';
import { Box, Paper, Typography, Stack, useTheme } from '@mui/material';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { useSimulationStore } from '@/store/simulationStore';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const CHART_COLORS = [
    '#2383e2',
    '#0f7b6c',
    '#cb912f',
    '#9b59b6',
    '#eb5757',
    '#3498db',
    '#1abc9c',
    '#f39c12',
    '#e74c3c',
    '#2ecc71',
];

export function Charts() {
    const theme = useTheme();
    const { currentSession, state } = useSimulationStore();

    const modelStats = currentSession?.modelStats || [];
    const topStats = modelStats.slice(0, 10);

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
                    Charts
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
                            ? 'Start a simulation to see charts'
                            : 'Waiting for data...'}
                    </Typography>
                </Box>
            </Paper>
        );
    }

    const barData = {
        labels: topStats.map((s) => s.modelKey),
        datasets: [
            {
                label: 'Percentage',
                data: topStats.map((s) => s.percentage),
                backgroundColor: CHART_COLORS.slice(0, topStats.length),
                borderColor: CHART_COLORS.slice(0, topStats.length),
                borderWidth: 1,
                borderRadius: 4,
            },
        ],
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y' as const,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#fff',
                titleColor: theme.palette.text.primary,
                bodyColor: theme.palette.text.primary,
                borderColor: theme.palette.divider,
                borderWidth: 1,
                padding: 12,
                cornerRadius: 6,
                callbacks: {
                    label: (context: any) => `${context.raw.toFixed(1)}%`,
                },
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                max: 100,
                grid: {
                    color: theme.palette.divider,
                },
                ticks: {
                    color: theme.palette.text.secondary,
                    callback: (value: any) => `${value}%`,
                },
            },
            y: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: theme.palette.text.primary,
                    font: {
                        size: 11,
                    },
                },
            },
        },
    };

    const pieData = {
        labels: topStats.map((s) => s.modelKey),
        datasets: [
            {
                data: topStats.map((s) => s.count),
                backgroundColor: CHART_COLORS.slice(0, topStats.length),
                borderColor: theme.palette.background.paper,
                borderWidth: 2,
            },
        ],
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    color: theme.palette.text.primary,
                    font: {
                        size: 11,
                    },
                    padding: 12,
                    boxWidth: 12,
                    boxHeight: 12,
                },
            },
            tooltip: {
                backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#fff',
                titleColor: theme.palette.text.primary,
                bodyColor: theme.palette.text.primary,
                borderColor: theme.palette.divider,
                borderWidth: 1,
                padding: 12,
                cornerRadius: 6,
                callbacks: {
                    label: (context: any) => {
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((context.raw / total) * 100).toFixed(1);
                        return `${context.raw} (${percentage}%)`;
                    },
                },
            },
        },
    };

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
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Charts
            </Typography>

            <Stack spacing={4}>
                {/* Bar Chart */}
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>
                        Model Distribution
                    </Typography>
                    <Box sx={{ height: Math.max(200, topStats.length * 35) }}>
                        <Bar data={barData} options={barOptions} />
                    </Box>
                </Box>

                {/* Pie Chart */}
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>
                        Percentage Breakdown
                    </Typography>
                    <Box sx={{ height: 300 }}>
                        <Pie data={pieData} options={pieOptions} />
                    </Box>
                </Box>
            </Stack>
        </Paper>
    );
}

export default Charts;
