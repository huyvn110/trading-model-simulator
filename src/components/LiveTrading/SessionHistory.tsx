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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    DeleteSweep as ClearIcon,
    Visibility as ViewIcon,
    CheckCircle as WinIcon,
    Cancel as LoseIcon,
} from '@mui/icons-material';
import { useLiveSessionStore } from '@/store/liveSessionStore';
import { LiveSession } from '@/types';

interface SessionDetailDialogProps {
    session: LiveSession | null;
    open: boolean;
    onClose: () => void;
}

function SessionDetailDialog({ session, open, onClose }: SessionDetailDialogProps) {
    if (!session) return null;

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatValue = (value: number) => {
        switch (session.measurementMode) {
            case 'RR':
                return `${value}R`;
            case '$':
                return `$${value}`;
            case '%':
                return `${value}%`;
        }
    };

    const wins = session.trades.filter((t) => t.result === 'win').length;
    const losses = session.trades.filter((t) => t.result === 'lose').length;
    const winRate = session.trades.length > 0
        ? (wins / session.trades.length) * 100
        : 0;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Session Details - {formatDate(session.startTime)}
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Chip label={`Mode: ${session.measurementMode}`} />
                        <Chip label={`${session.trades.length} trades`} />
                        <Chip label={`${wins}W / ${losses}L`} color="primary" />
                        <Chip
                            label={`${winRate.toFixed(0)}% win rate`}
                            color={winRate >= 50 ? 'success' : 'error'}
                        />
                    </Box>

                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Time</TableCell>
                                <TableCell>Model</TableCell>
                                <TableCell align="right">Value</TableCell>
                                <TableCell align="center">Result</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {session.trades.map((trade) => (
                                <TableRow key={trade.id}>
                                    <TableCell>
                                        {new Date(trade.timestamp).toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </TableCell>
                                    <TableCell>{trade.modelName}</TableCell>
                                    <TableCell align="right">
                                        {formatValue(trade.measurementValue)}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            icon={trade.result === 'win' ? <WinIcon /> : <LoseIcon />}
                                            label={trade.result === 'win' ? 'W' : 'L'}
                                            size="small"
                                            color={trade.result === 'win' ? 'success' : 'error'}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}

export function SessionHistory() {
    const { sessionHistory, deleteSessionFromHistory, clearHistory, endSession, currentSession } = useLiveSessionStore();
    const [clearDialogOpen, setClearDialogOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleViewDetails = (session: LiveSession) => {
        setSelectedSession(session);
        setDetailsOpen(true);
    };

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
                        Session History
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        {currentSession && currentSession.trades.length > 0 && (
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={endSession}
                            >
                                End Current Session
                            </Button>
                        )}
                        {sessionHistory.length > 0 && (
                            <Tooltip title="Clear All History">
                                <IconButton
                                    size="small"
                                    onClick={() => setClearDialogOpen(true)}
                                    sx={{ color: 'error.main' }}
                                >
                                    <ClearIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                </Box>

                {sessionHistory.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                        <Typography variant="body1">
                            No session history yet
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {sessionHistory.map((session) => {
                            const wins = session.trades.filter((t) => t.result === 'win').length;
                            const losses = session.trades.filter((t) => t.result === 'lose').length;
                            const winRate = session.trades.length > 0
                                ? (wins / session.trades.length) * 100
                                : 0;

                            return (
                                <ListItem
                                    key={session.id}
                                    sx={{
                                        borderRadius: 1.5,
                                        mb: 1,
                                        bgcolor: 'grey.50',
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Typography variant="body1" fontWeight={500}>
                                                {formatDate(session.startTime)}
                                            </Typography>
                                        }
                                        secondary={
                                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                                <Chip
                                                    label={session.measurementMode}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    label={`${session.trades.length} trades`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    label={`${winRate.toFixed(0)}%`}
                                                    size="small"
                                                    color={winRate >= 50 ? 'success' : 'error'}
                                                />
                                            </Stack>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Stack direction="row" spacing={0.5}>
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleViewDetails(session)}
                                                >
                                                    <ViewIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => deleteSessionFromHistory(session.id)}
                                                    sx={{ color: 'error.main' }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            );
                        })}
                    </List>
                )}
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
                        This will permanently delete all {sessionHistory.length} session records.
                        This action cannot be undone.
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

            <SessionDetailDialog
                session={selectedSession}
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
            />
        </>
    );
}

export default SessionHistory;
