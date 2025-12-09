'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Slider,
    TextField,
    IconButton,
    LinearProgress,
    Stack,
    Chip,
} from '@mui/material';
import {
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Stop as StopIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSimulationStore } from '@/store/simulationStore';
import { useFactorStore } from '@/store/factorStore';

export function SimulationControls() {
    const {
        settings,
        updateSettings,
        state,
        currentSession,
        currentIteration,
        startSimulation,
        pauseSimulation,
        resumeSimulation,
        stopSimulation,
        addIteration,
        completeSimulation,
    } = useSimulationStore();

    const { factors } = useFactorStore();
    const selectedFactors = factors.filter((f) => f.selected);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const runIteration = useCallback(() => {
        if (selectedFactors.length === 0) return;

        const { minFactorsPerIteration, maxFactorsPerIteration } = settings;
        const min = Math.min(minFactorsPerIteration, selectedFactors.length);
        const max = Math.min(maxFactorsPerIteration, selectedFactors.length);
        const count = Math.floor(Math.random() * (max - min + 1)) + min;

        // Shuffle and pick random factors
        const shuffled = [...selectedFactors].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, count);
        const sortedFactorNames = picked
            .map((f) => f.name)
            .sort()
            .join('+');

        addIteration({
            selectedFactorIds: picked.map((f) => f.id),
            modelKey: sortedFactorNames,
        });
    }, [selectedFactors, settings, addIteration]);

    useEffect(() => {
        if (state === 'running' && currentSession) {
            intervalRef.current = setInterval(() => {
                if (currentIteration >= settings.iterationCount) {
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                    }
                    completeSimulation();
                } else {
                    runIteration();
                }
            }, settings.speed);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [state, currentSession, currentIteration, settings.iterationCount, settings.speed, runIteration, completeSimulation]);

    const handleStart = () => {
        if (selectedFactors.length === 0) return;
        startSimulation(selectedFactors);
    };

    const handlePause = () => {
        pauseSimulation();
    };

    const handleResume = () => {
        resumeSimulation();
    };

    const handleStop = () => {
        stopSimulation();
    };

    const progress = currentSession
        ? (currentIteration / settings.iterationCount) * 100
        : 0;

    const getStatusColor = () => {
        switch (state) {
            case 'running':
                return 'success';
            case 'paused':
                return 'warning';
            case 'completed':
                return 'primary';
            default:
                return 'default';
        }
    };

    const getStatusLabel = () => {
        switch (state) {
            case 'running':
                return 'Running';
            case 'paused':
                return 'Paused';
            case 'completed':
                return 'Completed';
            default:
                return 'Ready';
        }
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Simulation
                </Typography>
                <Chip
                    label={getStatusLabel()}
                    color={getStatusColor()}
                    size="small"
                    variant={state === 'idle' ? 'outlined' : 'filled'}
                    icon={
                        <Box
                            className={`status-dot ${state}`}
                            sx={{ ml: 1 }}
                        />
                    }
                />
            </Box>

            <Stack spacing={2.5}>
                {/* Iterations */}
                <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Number of Iterations
                    </Typography>
                    <TextField
                        type="number"
                        value={settings.iterationCount}
                        onChange={(e) =>
                            updateSettings({ iterationCount: Math.max(1, parseInt(e.target.value) || 1) })
                        }
                        size="small"
                        fullWidth
                        disabled={state === 'running'}
                        inputProps={{ min: 1, max: 100000 }}
                    />
                </Box>

                {/* Speed */}
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Speed
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {settings.speed}ms delay
                        </Typography>
                    </Box>
                    <Slider
                        value={settings.speed}
                        onChange={(_, value) => updateSettings({ speed: value as number })}
                        min={10}
                        max={1000}
                        step={10}
                        disabled={state === 'running'}
                        sx={{ mt: 1 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                            Fast
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Slow
                        </Typography>
                    </Box>
                </Box>

                {/* Factors per iteration */}
                <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Factors per Iteration
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Min"
                            type="number"
                            value={settings.minFactorsPerIteration}
                            onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                updateSettings({
                                    minFactorsPerIteration: val,
                                    maxFactorsPerIteration: Math.max(val, settings.maxFactorsPerIteration),
                                });
                            }}
                            size="small"
                            disabled={state === 'running'}
                            inputProps={{ min: 1 }}
                            sx={{ flex: 1 }}
                        />
                        <TextField
                            label="Max"
                            type="number"
                            value={settings.maxFactorsPerIteration}
                            onChange={(e) => {
                                const val = Math.max(settings.minFactorsPerIteration, parseInt(e.target.value) || 1);
                                updateSettings({ maxFactorsPerIteration: val });
                            }}
                            size="small"
                            disabled={state === 'running'}
                            inputProps={{ min: settings.minFactorsPerIteration }}
                            sx={{ flex: 1 }}
                        />
                    </Stack>
                </Box>

                {/* Progress */}
                {currentSession && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Progress
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {currentIteration} / {settings.iterationCount}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: 'grey.200',
                                '& .MuiLinearProgress-bar': {
                                    borderRadius: 4,
                                },
                            }}
                        />
                    </Box>
                )}

                {/* Control Buttons */}
                <Stack direction="row" spacing={1.5}>
                    {state === 'idle' && (
                        <Button
                            variant="contained"
                            fullWidth
                            startIcon={<PlayIcon />}
                            onClick={handleStart}
                            disabled={selectedFactors.length === 0}
                            sx={{ py: 1.25 }}
                        >
                            Start Simulation
                        </Button>
                    )}

                    {state === 'running' && (
                        <>
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<PauseIcon />}
                                onClick={handlePause}
                            >
                                Pause
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<StopIcon />}
                                onClick={handleStop}
                            >
                                Stop
                            </Button>
                        </>
                    )}

                    {state === 'paused' && (
                        <>
                            <Button
                                variant="contained"
                                fullWidth
                                startIcon={<PlayIcon />}
                                onClick={handleResume}
                            >
                                Resume
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<StopIcon />}
                                onClick={handleStop}
                            >
                                Stop
                            </Button>
                        </>
                    )}

                    {state === 'completed' && (
                        <Button
                            variant="contained"
                            fullWidth
                            startIcon={<RefreshIcon />}
                            onClick={handleStop}
                            sx={{ py: 1.25 }}
                        >
                            New Simulation
                        </Button>
                    )}
                </Stack>

                {/* Warning for no factors */}
                {selectedFactors.length === 0 && state === 'idle' && (
                    <Typography
                        variant="body2"
                        color="warning.main"
                        sx={{ textAlign: 'center', mt: 1 }}
                    >
                        Select at least one factor to start simulation
                    </Typography>
                )}
            </Stack>
        </Paper>
    );
}

export default SimulationControls;
