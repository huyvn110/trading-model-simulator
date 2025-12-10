'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
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
    IconButton,
    Chip,
    Tooltip,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Notes as NotesIcon,
    Image as ImageIcon,
    CheckCircle as WinIcon,
    Cancel as LoseIcon,
} from '@mui/icons-material';
import { useLiveSessionStore } from '@/store/liveSessionStore';
import { LiveTrade } from '@/types';

interface TradeDetailsDialogProps {
    trade: LiveTrade | null;
    open: boolean;
    onClose: () => void;
}

function TradeDetailsDialog({ trade: tradeProp, open, onClose }: TradeDetailsDialogProps) {
    const { currentSession, updateTradeNotes, addTradeImage, removeTradeImage } = useLiveSessionStore();
    const [notes, setNotes] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get fresh trade data from store
    const trade = currentSession?.trades.find(t => t.id === tradeProp?.id) || tradeProp;

    React.useEffect(() => {
        if (trade) {
            setNotes(trade.notes || '');
        }
    }, [trade?.id]);

    const handleSaveNotes = () => {
        if (trade) {
            updateTradeNotes(trade.id, notes);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !trade) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            addTradeImage(trade.id, base64);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // Handle paste image from clipboard
    const handlePaste = useCallback((e: ClipboardEvent) => {
        if (!trade || !open) return;

        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault();
                e.stopPropagation();
                const blob = items[i].getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const base64 = event.target?.result as string;
                        addTradeImage(trade.id, base64);
                    };
                    reader.readAsDataURL(blob);
                }
                break;
            }
        }
    }, [trade?.id, open, addTradeImage]);

    useEffect(() => {
        if (open && trade) {
            document.addEventListener('paste', handlePaste, true);
            return () => document.removeEventListener('paste', handlePaste, true);
        }
    }, [open, trade?.id, handlePaste]);

    if (!trade) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Trade Details - {trade.modelName}
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Result
                        </Typography>
                        <Chip
                            icon={trade.result === 'win' ? <WinIcon /> : <LoseIcon />}
                            label={trade.result.toUpperCase()}
                            color={trade.result === 'win' ? 'success' : 'error'}
                        />
                    </Box>

                    <TextField
                        label="Notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        onBlur={handleSaveNotes}
                        multiline
                        rows={3}
                        fullWidth
                        placeholder="Add notes about this trade..."
                    />

                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Images (Ctrl+V to paste)
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {trade.images?.map((img, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        position: 'relative',
                                        width: 100,
                                        height: 100,
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                    }}
                                >
                                    <img
                                        src={img}
                                        alt={`Trade ${index + 1}`}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={() => removeTradeImage(trade.id, index)}
                                        sx={{
                                            position: 'absolute',
                                            top: 2,
                                            right: 2,
                                            bgcolor: 'rgba(0,0,0,0.5)',
                                            color: 'white',
                                            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                                        }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))}
                            <Button
                                variant="outlined"
                                onClick={() => fileInputRef.current?.click()}
                                sx={{ width: 100, height: 100 }}
                            >
                                <ImageIcon />
                            </Button>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleImageUpload}
                            />
                        </Stack>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}

export function TradeList() {
    const { currentSession, deleteTrade } = useLiveSessionStore();
    const [selectedTrade, setSelectedTrade] = useState<LiveTrade | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [filterModel, setFilterModel] = useState<string>('all');

    const trades = currentSession?.trades || [];

    // Get unique model names for filter dropdown
    const modelNames = Array.from(new Set(trades.map(t => t.modelName))).sort();

    // Filter trades by model
    const filteredTrades = filterModel === 'all'
        ? trades
        : trades.filter(t => t.modelName === filterModel);
    const measurementMode = currentSession?.measurementMode || 'RR';

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatValue = (value: number) => {
        switch (measurementMode) {
            case 'RR':
                return `${value}R`;
            case '$':
                return `$${value}`;
            case '%':
                return `${value}%`;
        }
    };

    const handleOpenDetails = (trade: LiveTrade) => {
        setSelectedTrade(trade);
        setDetailsOpen(true);
    };

    if (trades.length === 0) {
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
                    Trades
                </Typography>
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <Typography variant="body1">
                        No trades yet. Add your first trade.
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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Trades
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Model</InputLabel>
                            <Select
                                value={filterModel}
                                label="Model"
                                onChange={(e) => setFilterModel(e.target.value)}
                            >
                                <MenuItem value="all">Tất cả</MenuItem>
                                {modelNames.map((name) => (
                                    <MenuItem key={name} value={name}>{name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Chip
                            label={`${filteredTrades.length} trades`}
                            size="small"
                            variant="outlined"
                        />
                    </Box>
                </Box>

                <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Time</TableCell>
                                <TableCell>Model</TableCell>
                                <TableCell align="right">Value</TableCell>
                                <TableCell align="center">Result</TableCell>
                                <TableCell align="center">Notes</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {[...filteredTrades].reverse().map((trade) => (
                                <TableRow key={trade.id} hover>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {formatTime(trade.timestamp)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={trade.modelName}
                                            size="small"
                                            sx={{ fontSize: '0.75rem' }}
                                        />
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
                                            sx={{ fontWeight: 600 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={0.5} justifyContent="center">
                                            {trade.notes && (
                                                <Tooltip title="Has notes">
                                                    <NotesIcon fontSize="small" color="primary" />
                                                </Tooltip>
                                            )}
                                            {trade.images && trade.images.length > 0 && (
                                                <Tooltip title={`${trade.images.length} image(s)`}>
                                                    <ImageIcon fontSize="small" color="primary" />
                                                </Tooltip>
                                            )}
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                            <Tooltip title="Edit details">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenDetails(trade)}
                                                >
                                                    <NotesIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => deleteTrade(trade.id)}
                                                    sx={{ color: 'error.main' }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <TradeDetailsDialog
                trade={selectedTrade}
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
            />
        </>
    );
}

export default TradeList;
