'use client';

import React, { useState, useEffect } from 'react';
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
    Edit as EditIcon,
} from '@mui/icons-material';
import { useLiveSessionStore } from '@/store/liveSessionStore';
import { LiveTrade, ContentBlock } from '@/types';
import { NotionEditor, migrateToContentBlocks, extractFromContentBlocks } from '@/components/shared/NotionEditor';

interface TradeDetailsDialogProps {
    trade: LiveTrade | null;
    open: boolean;
    onClose: () => void;
}

function TradeDetailsDialog({ trade: tradeProp, open, onClose }: TradeDetailsDialogProps) {
    const { currentSession, updateTradeContent } = useLiveSessionStore();
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

    // Get fresh trade data from store
    const trade = currentSession?.trades.find(t => t.id === tradeProp?.id) || tradeProp;

    useEffect(() => {
        if (trade) {
            // Migrate legacy notes/images to content blocks if needed
            const blocks = migrateToContentBlocks(trade.notes, trade.images, trade.content);
            setContentBlocks(blocks);
        }
    }, [trade?.id, trade?.content, trade?.notes, trade?.images]);

    const handleContentChange = (newBlocks: ContentBlock[]) => {
        setContentBlocks(newBlocks);
        if (trade) {
            updateTradeContent(trade.id, newBlocks);
        }
    };

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

                    {/* Notion-like Content Editor */}
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Ghi chú & Hình ảnh
                        </Typography>
                        <NotionEditor
                            blocks={contentBlocks}
                            onChange={handleContentChange}
                            placeholder="Thêm ghi chú hoặc ảnh..."
                        />
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

    // Helper to check if trade has content
    const hasContent = (trade: LiveTrade) => {
        return (trade.content && trade.content.length > 0) ||
            trade.notes ||
            (trade.images && trade.images.length > 0);
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
                                <TableCell align="center">Content</TableCell>
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
                                        {hasContent(trade) && (
                                            <Tooltip title="Has content">
                                                <NotesIcon fontSize="small" color="primary" />
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                            <Tooltip title="Edit details">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenDetails(trade)}
                                                >
                                                    <EditIcon fontSize="small" />
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
