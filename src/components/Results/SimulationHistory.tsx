'use client';

import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Button,
    Tooltip,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Download as DownloadIcon,
    DeleteSweep as ClearIcon,
} from '@mui/icons-material';
import { saveAs } from 'file-saver';
import { useSimulationStore } from '@/store/simulationStore';
import { SimulationSession } from '@/types';

export function SimulationHistory() {
    const { history, deleteSession, clearHistory } = useSimulationStore();
    const [clearDialogOpen, setClearDialogOpen] = useState(false);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const exportToCSV = (session: SimulationSession) => {
        const headers = ['Model', 'Count', 'Percentage'];
        const rows = session.modelStats.map((s) => [
            s.modelKey,
            s.count.toString(),
            s.percentage.toFixed(2) + '%',
        ]);

        const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `simulation_${formatDate(session.timestamp).replace(/[/:]/g, '-')}.csv`);
    };

    const exportToJSON = (session: SimulationSession) => {
        const data = {
            timestamp: session.timestamp,
            date: formatDate(session.timestamp),
            totalIterations: session.iterations.length,
            factors: session.factorsSnapshot.map((f) => f.name),
            results: session.modelStats.map((s) => ({
                model: s.modelKey,
                factors: s.factorNames,
                count: s.count,
                percentage: s.percentage,
            })),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json;charset=utf-8',
        });
        saveAs(blob, `simulation_${formatDate(session.timestamp).replace(/[/:]/g, '-')}.json`);
    };

    if (history.length === 0) {
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
                    History
                </Typography>
                <Box
                    sx={{
                        py: 4,
                        textAlign: 'center',
                        color: 'text.secondary',
                    }}
                >
                    <Typography variant="body1">
                        No simulation history yet
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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        History
                    </Typography>
                    <Tooltip title="Clear All History">
                        <IconButton
                            size="small"
                            onClick={() => setClearDialogOpen(true)}
                            sx={{ color: 'error.main' }}
                        >
                            <ClearIcon />
                        </IconButton>
                    </Tooltip>
                </Box>

                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {history.map((session, index) => (
                        <ListItem
                            key={session.id}
                            className="fade-in"
                            sx={{
                                borderRadius: 1.5,
                                mb: 1,
                                bgcolor: 'grey.50',
                                animationDelay: `${index * 50}ms`,
                            }}
                        >
                            <ListItemText
                                primary={
                                    <Typography variant="body1" fontWeight={500}>
                                        {formatDate(session.timestamp)}
                                    </Typography>
                                }
                                secondary={
                                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                        <Chip
                                            label={`${session.iterations.length} iterations`}
                                            size="small"
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={`${session.modelStats.length} models`}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Stack>
                                }
                            />
                            <ListItemSecondaryAction>
                                <Stack direction="row" spacing={0.5}>
                                    <Tooltip title="Export CSV">
                                        <IconButton
                                            size="small"
                                            onClick={() => exportToCSV(session)}
                                        >
                                            <DownloadIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Export JSON">
                                        <IconButton
                                            size="small"
                                            onClick={() => exportToJSON(session)}
                                        >
                                            <DownloadIcon fontSize="small" sx={{ color: 'success.main' }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton
                                            size="small"
                                            onClick={() => deleteSession(session.id)}
                                            sx={{ color: 'error.main' }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            </Paper>

            {/* Clear Confirmation Dialog */}
            <Dialog
                open={clearDialogOpen}
                onClose={() => setClearDialogOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Clear All History?</DialogTitle>
                <DialogContent>
                    <Typography>
                        This will permanently delete all {history.length} simulation records. This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setClearDialogOpen(false)}>Cancel</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={() => {
                            clearHistory();
                            setClearDialogOpen(false);
                        }}
                    >
                        Clear All
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default SimulationHistory;
