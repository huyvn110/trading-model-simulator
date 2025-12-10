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
import { useTestSessionStore, TestSession, TestTrade } from '@/store/testSessionStore';
import { useFactorStore } from '@/store/factorStore';

interface SessionDetailDialogProps {
    session: TestSession | null;
    open: boolean;
    onClose: () => void;
}

function SessionDetailDialog({ session, open, onClose }: SessionDetailDialogProps) {
    const [activeTab, setActiveTab] = useState(0);
    const [selectedTrade, setSelectedTrade] = useState<TestTrade | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const { factors } = useFactorStore();

    const getFactorName = (id: string) => {
        return factors.find(f => f.id === id)?.name || id;
    };

    if (!session) return null;

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
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

    const trades = session.trades;
    const wins = trades.filter(t => t.result === 'win').length;
    const losses = trades.filter(t => t.result === 'lose').length;
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
    const totalValue = trades.reduce((sum, t) => {
        return sum + (t.result === 'win' ? t.measurementValue : -t.measurementValue);
    }, 0);

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">{session.name}</Typography>
                        <Stack direction="row" spacing={1}>
                            <Chip
                                label={`${trades.length} trades`}
                                size="small"
                                variant="outlined"
                            />
                            <Chip
                                label={`WR: ${winRate.toFixed(1)}%`}
                                size="small"
                                color={winRate >= 50 ? 'success' : 'error'}
                            />
                            <Chip
                                label={formatValue(totalValue)}
                                size="small"
                                color={totalValue >= 0 ? 'success' : 'error'}
                            />
                        </Stack>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        {formatDate(session.startTime)} - {session.endTime ? formatDate(session.endTime) : 'Đang tiến hành'}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
                        <Tab label="Trades" />
                        <Tab label="Thống kê" />
                    </Tabs>

                    {activeTab === 0 && (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Thời gian</TableCell>
                                    <TableCell>Model</TableCell>
                                    <TableCell align="right">Giá trị</TableCell>
                                    <TableCell align="center">Kết quả</TableCell>
                                    <TableCell align="center">Info</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {[...trades].reverse().map((trade) => (
                                    <TableRow
                                        key={trade.id}
                                        hover
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => setSelectedTrade(trade)}
                                    >
                                        <TableCell>
                                            {new Date(trade.timestamp).toLocaleTimeString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                {trade.factorIds.map(id => (
                                                    <Chip
                                                        key={id}
                                                        label={getFactorName(id)}
                                                        size="small"
                                                        sx={{ fontSize: '0.7rem' }}
                                                    />
                                                ))}
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={500}>
                                                {formatValue(trade.measurementValue)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                icon={trade.result === 'win' ? <WinIcon /> : <LoseIcon />}
                                                label={trade.result === 'win' ? 'W' : 'L'}
                                                size="small"
                                                color={trade.result === 'win' ? 'success' : 'error'}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={0.5} justifyContent="center">
                                                {trade.notes && (
                                                    <Tooltip title={trade.notes}>
                                                        <NotesIcon fontSize="small" color="primary" />
                                                    </Tooltip>
                                                )}
                                                {trade.images && trade.images.length > 0 && (
                                                    <Tooltip title={`${trade.images.length} ảnh`}>
                                                        <ImageIcon fontSize="small" color="primary" />
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {activeTab === 1 && (
                        <Box>
                            <Stack spacing={2}>
                                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                                    <Typography variant="subtitle2" gutterBottom>Tổng quan</Typography>
                                    <Stack direction="row" spacing={4}>
                                        <Box>
                                            <Typography variant="h4" fontWeight={600}>{trades.length}</Typography>
                                            <Typography variant="body2" color="text.secondary">Trades</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="h4" fontWeight={600} color="success.main">{wins}</Typography>
                                            <Typography variant="body2" color="text.secondary">Wins</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="h4" fontWeight={600} color="error.main">{losses}</Typography>
                                            <Typography variant="body2" color="text.secondary">Losses</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="h4" fontWeight={600} color={winRate >= 50 ? 'success.main' : 'error.main'}>
                                                {winRate.toFixed(1)}%
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">Win Rate</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="h4" fontWeight={600} color={totalValue >= 0 ? 'success.main' : 'error.main'}>
                                                {formatValue(totalValue)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">P/L</Typography>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Stack>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Đóng</Button>
                </DialogActions>
            </Dialog>

            {/* Trade Detail Dialog */}
            <Dialog
                open={!!selectedTrade}
                onClose={() => setSelectedTrade(null)}
                maxWidth="sm"
                fullWidth
            >
                {selectedTrade && (
                    <>
                        <DialogTitle>Chi tiết Trade</DialogTitle>
                        <DialogContent>
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Model
                                    </Typography>
                                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                        {selectedTrade.factorIds.map(id => (
                                            <Chip key={id} label={getFactorName(id)} size="small" color="primary" />
                                        ))}
                                    </Stack>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Kết quả
                                    </Typography>
                                    <Chip
                                        icon={selectedTrade.result === 'win' ? <WinIcon /> : <LoseIcon />}
                                        label={selectedTrade.result.toUpperCase()}
                                        color={selectedTrade.result === 'win' ? 'success' : 'error'}
                                    />
                                </Box>
                                {selectedTrade.notes && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Ghi chú
                                        </Typography>
                                        <Paper sx={{ p: 1.5, bgcolor: 'primary.50' }}>
                                            <Typography variant="body2">{selectedTrade.notes}</Typography>
                                        </Paper>
                                    </Box>
                                )}
                                {selectedTrade.images && selectedTrade.images.length > 0 && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Hình ảnh
                                        </Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                            {selectedTrade.images.map((img, index) => (
                                                <Box
                                                    key={index}
                                                    sx={{
                                                        width: 80,
                                                        height: 80,
                                                        borderRadius: 1,
                                                        overflow: 'hidden',
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                        cursor: 'pointer',
                                                        '&:hover': { opacity: 0.8 },
                                                    }}
                                                    onClick={() => setPreviewImage(img)}
                                                >
                                                    <img
                                                        src={img}
                                                        alt={`Trade ${index + 1}`}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Box>
                                )}
                            </Stack>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setSelectedTrade(null)}>Đóng</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Image Preview Dialog */}
            <Dialog
                open={!!previewImage}
                onClose={() => setPreviewImage(null)}
                maxWidth="lg"
            >
                {previewImage && (
                    <Box sx={{ bgcolor: 'black', p: 1 }}>
                        <img
                            src={previewImage}
                            alt="Preview"
                            style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain' }}
                        />
                    </Box>
                )}
                <DialogActions sx={{ bgcolor: 'black' }}>
                    <Button onClick={() => setPreviewImage(null)} sx={{ color: 'white' }}>
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export function SessionHistory() {
    const { sessions, deleteSession, currentSession } = useTestSessionStore();
    const [selectedSession, setSelectedSession] = useState<TestSession | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    // Filter completed sessions (not the current one)
    const completedSessions = sessions.filter(s => s.endTime && s.id !== currentSession?.id);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const handleViewDetails = (session: TestSession) => {
        setSelectedSession(session);
        setDetailsOpen(true);
    };

    if (completedSessions.length === 0) {
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
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Lịch sử Session
                </Typography>
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <Typography variant="body1">
                        Chưa có session nào hoàn thành.
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
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Lịch sử Session
                    </Typography>
                    <Chip
                        label={`${completedSessions.length} sessions`}
                        size="small"
                        variant="outlined"
                    />
                </Box>

                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {completedSessions.map((session) => {
                        const wins = session.trades.filter(t => t.result === 'win').length;
                        const winRate = session.trades.length > 0 ? (wins / session.trades.length) * 100 : 0;

                        return (
                            <ListItem
                                key={session.id}
                                divider
                                sx={{
                                    borderRadius: 1,
                                    mb: 0.5,
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                            >
                                <ListItemText
                                    primary={session.name}
                                    secondary={
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography variant="caption">
                                                {formatDate(session.startTime)}
                                            </Typography>
                                            <Chip
                                                label={`${session.trades.length} trades`}
                                                size="small"
                                                sx={{ fontSize: '0.65rem', height: 20 }}
                                            />
                                            <Chip
                                                label={`WR: ${winRate.toFixed(0)}%`}
                                                size="small"
                                                color={winRate >= 50 ? 'success' : 'error'}
                                                sx={{ fontSize: '0.65rem', height: 20 }}
                                            />
                                        </Stack>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <Stack direction="row" spacing={0.5}>
                                        <Tooltip title="Xem chi tiết">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleViewDetails(session)}
                                            >
                                                <ViewIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Xóa">
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
                        );
                    })}
                </List>
            </Paper>

            <SessionDetailDialog
                session={selectedSession}
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
            />
        </>
    );
}

export default SessionHistory;
