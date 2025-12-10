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
    Tabs,
    Tab,
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
    Notes as NotesIcon,
    Image as ImageIcon,
} from '@mui/icons-material';
import { useLiveSessionStore } from '@/store/liveSessionStore';
import { LiveSession, LiveTrade } from '@/types';
import { SessionStatsView } from './SessionStatsView';

interface SessionDetailDialogProps {
    session: LiveSession | null;
    open: boolean;
    onClose: () => void;
}

function SessionDetailDialog({ session, open, onClose }: SessionDetailDialogProps) {
    const [activeTab, setActiveTab] = useState(0);
    const [selectedTrade, setSelectedTrade] = useState<LiveTrade | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

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
            case 'RR': return `${value}R`;
            case '$': return `$${value}`;
            case '%': return `${value}%`;
        }
    };

    const wins = session.trades.filter((t) => t.result === 'win').length;
    const losses = session.trades.filter((t) => t.result === 'lose').length;
    const winRate = session.trades.length > 0
        ? (wins / session.trades.length) * 100
        : 0;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ pb: 0 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="h6" fontWeight={600}>
                        📊 Session - {formatDate(session.startTime)}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Chip label={session.measurementMode} size="small" />
                        <Chip label={`${session.trades.length} trades`} size="small" />
                        <Chip label={`${winRate.toFixed(0)}%`} size="small" color={winRate >= 50 ? 'success' : 'error'} />
                    </Stack>
                </Stack>
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="📈 Stats" />
                    <Tab label="📋 Trades" />
                </Tabs>
            </DialogTitle>
            <DialogContent sx={{ bgcolor: activeTab === 0 ? 'grey.100' : 'background.paper', minHeight: 400 }}>
                <Box sx={{ mt: 2 }}>
                    {activeTab === 0 && (
                        <SessionStatsView session={session} />
                    )}
                    {activeTab === 1 && (
                        <Box>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                                        <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Model</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Value</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Result</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Info</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {session.trades.map((trade, index) => (
                                        <TableRow
                                            key={trade.id}
                                            sx={{
                                                '&:hover': { bgcolor: 'primary.50', cursor: 'pointer' },
                                                transition: 'background-color 0.2s',
                                            }}
                                            onClick={() => setSelectedTrade(trade)}
                                        >
                                            <TableCell sx={{ color: 'text.secondary' }}>{index + 1}</TableCell>
                                            <TableCell>
                                                {new Date(trade.timestamp).toLocaleTimeString('vi-VN', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={trade.modelName} size="small" variant="outlined" />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography fontWeight={500}>
                                                    {formatValue(trade.measurementValue)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    icon={trade.result === 'win' ? <WinIcon /> : <LoseIcon />}
                                                    label={trade.result === 'win' ? 'WIN' : 'LOSE'}
                                                    size="small"
                                                    color={trade.result === 'win' ? 'success' : 'error'}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={0.5} justifyContent="center">
                                                    {trade.notes && <NotesIcon fontSize="small" color="primary" />}
                                                    {trade.images && trade.images.length > 0 && <ImageIcon fontSize="small" color="primary" />}
                                                    {!trade.notes && (!trade.images || trade.images.length === 0) && (
                                                        <Typography color="text.disabled">-</Typography>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {session.trades.length === 0 && (
                                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                                    <Typography>Không có trades</Typography>
                                </Box>
                            )}
                            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2, color: 'text.secondary' }}>
                                💡 Bấm vào lệnh để xem chi tiết
                            </Typography>
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained">Đóng</Button>
            </DialogActions>

            {/* Trade Detail Dialog */}
            <Dialog
                open={!!selectedTrade}
                onClose={() => setSelectedTrade(null)}
                maxWidth="md"
                fullWidth
            >
                {selectedTrade && (
                    <>
                        <DialogTitle>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Typography variant="h6" fontWeight={600}>
                                    Chi tiết lệnh #{session.trades.findIndex(t => t.id === selectedTrade.id) + 1}
                                </Typography>
                                <Chip
                                    icon={selectedTrade.result === 'win' ? <WinIcon /> : <LoseIcon />}
                                    label={selectedTrade.result === 'win' ? 'WIN' : 'LOSE'}
                                    color={selectedTrade.result === 'win' ? 'success' : 'error'}
                                />
                            </Stack>
                        </DialogTitle>
                        <DialogContent>
                            <Stack spacing={2.5} sx={{ mt: 1 }}>
                                {/* Basic Info Grid */}
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: 2,
                                    }}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Model</Typography>
                                            <Typography fontWeight={600}>{selectedTrade.modelName}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Giá trị</Typography>
                                            <Typography fontWeight={600}>{formatValue(selectedTrade.measurementValue)}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Thời gian</Typography>
                                            <Typography fontWeight={600}>{new Date(selectedTrade.timestamp).toLocaleString('vi-VN')}</Typography>
                                        </Box>
                                        {selectedTrade.profitRatio && (
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">Profit Ratio</Typography>
                                                <Typography fontWeight={600} color="success.main">{selectedTrade.profitRatio}</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Paper>

                                {/* Notes */}
                                {selectedTrade.notes && (
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50' }}>
                                        <Typography variant="subtitle2" color="primary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <NotesIcon fontSize="small" /> Ghi chú
                                        </Typography>
                                        <Typography>{selectedTrade.notes}</Typography>
                                    </Paper>
                                )}

                                {/* Images - Thumbnails with click to expand */}
                                {selectedTrade.images && selectedTrade.images.length > 0 && (
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" color="primary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ImageIcon fontSize="small" /> Hình ảnh
                                        </Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                            {selectedTrade.images.map((img, imgIndex) => (
                                                <Box
                                                    key={imgIndex}
                                                    component="img"
                                                    src={img}
                                                    alt={`Trade image ${imgIndex + 1}`}
                                                    onClick={() => setPreviewImage(img)}
                                                    sx={{
                                                        width: 80,
                                                        height: 80,
                                                        objectFit: 'cover',
                                                        borderRadius: 1,
                                                        cursor: 'pointer',
                                                        border: '2px solid',
                                                        borderColor: 'divider',
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            borderColor: 'primary.main',
                                                            transform: 'scale(1.05)',
                                                            boxShadow: 2,
                                                        },
                                                    }}
                                                />
                                            ))}
                                        </Stack>
                                    </Paper>
                                )}

                                {/* No additional info */}
                                {!selectedTrade.notes && (!selectedTrade.images || selectedTrade.images.length === 0) && (
                                    <Box sx={{ py: 2, textAlign: 'center', color: 'text.secondary' }}>
                                        <Typography>Không có thông tin bổ sung</Typography>
                                    </Box>
                                )}
                            </Stack>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setSelectedTrade(null)} variant="outlined">Đóng</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Image Preview Dialog */}
            <Dialog
                open={!!previewImage}
                onClose={() => setPreviewImage(null)}
                maxWidth="lg"
                PaperProps={{ sx: { bgcolor: 'black' } }}
            >
                <DialogContent sx={{ p: 1 }}>
                    {previewImage && (
                        <Box
                            component="img"
                            src={previewImage}
                            alt="Preview"
                            sx={{
                                maxWidth: '100%',
                                maxHeight: '80vh',
                                display: 'block',
                                margin: 'auto',
                            }}
                        />
                    )}
                </DialogContent>
                <DialogActions sx={{ bgcolor: 'black' }}>
                    <Button onClick={() => setPreviewImage(null)} variant="contained" color="inherit">
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>
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
