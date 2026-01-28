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
import { useTestSessionStore, TestTrade } from '@/store/testSessionStore';
import { useFactorStore } from '@/store/factorStore';
import { ContentBlock } from '@/types';
import { NotionEditor, migrateToContentBlocks, extractFromContentBlocks } from '@/components/shared/NotionEditor';

interface TradeDetailsDialogProps {
    trade: TestTrade | null;
    open: boolean;
    onClose: () => void;
    getFactorName: (id: string) => string;
}

function TradeDetailsDialog({ trade: tradeProp, open, onClose, getFactorName }: TradeDetailsDialogProps) {
    const { currentSession, updateTradeContent } = useTestSessionStore();
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
            // Auto-save content blocks and also update legacy fields for backward compat
            const { notes, images } = extractFromContentBlocks(newBlocks);
            updateTradeContent(trade.id, newBlocks);
        }
    };

    if (!trade) return null;

    // Resolve factor names from IDs
    const factorNames = trade.factorIds.map(getFactorName).sort();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Chi tiết Trade
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2.5} sx={{ mt: 1 }}>
                    {/* Model & Result */}
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Model
                            </Typography>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                {factorNames.map((name) => (
                                    <Chip key={name} label={name} size="small" color="primary" />
                                ))}
                            </Stack>
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Kết quả
                            </Typography>
                            <Chip
                                icon={trade.result === 'win' ? <WinIcon /> : <LoseIcon />}
                                label={trade.result === 'win' ? 'WIN' : 'LOSE'}
                                color={trade.result === 'win' ? 'success' : 'error'}
                            />
                        </Box>
                    </Stack>

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
                <Button onClick={onClose}>Đóng</Button>
            </DialogActions>
        </Dialog>
    );
}

export function TestTrades() {
    const { currentSession, deleteTrade } = useTestSessionStore();
    const { factors } = useFactorStore();
    const [selectedTrade, setSelectedTrade] = useState<TestTrade | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [filterModelKey, setFilterModelKey] = useState<string>('all');

    // Create name resolver function
    const getFactorName = (id: string) => {
        const factor = factors.find((f) => f.id === id);
        return factor?.name || 'Unknown';
    };

    const trades = currentSession?.trades || [];
    const measurementMode = currentSession?.measurementMode || 'RR';

    // Get unique models from trades for filter
    const uniqueModels = React.useMemo(() => {
        const models = new Set<string>();
        trades.forEach(t => models.add(t.modelKey));
        return Array.from(models);
    }, [trades]);

    // Filter trades
    const filteredTrades = React.useMemo(() => {
        if (filterModelKey === 'all') return trades;
        return trades.filter(t => t.modelKey === filterModelKey);
    }, [trades, filterModelKey]);

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

    const handleOpenDetails = (trade: TestTrade) => {
        setSelectedTrade(trade);
        setDetailsOpen(true);
    };

    // Helper to check if trade has content
    const hasContent = (trade: TestTrade) => {
        return (trade.content && trade.content.length > 0) ||
            trade.notes ||
            (trade.images && trade.images.length > 0);
    };

    if (!currentSession || trades.length === 0) {
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
                        Chưa có trade nào
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
                        Trades
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                            label={`${filteredTrades.length} trades`}
                            size="small"
                            variant="outlined"
                        />
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Lọc theo Model</InputLabel>
                            <Select
                                value={filterModelKey}
                                label="Lọc theo Model"
                                onChange={(e) => setFilterModelKey(e.target.value)}
                            >
                                <MenuItem value="all">Tất cả</MenuItem>
                                {uniqueModels.map((modelKey) => {
                                    const factorIds = modelKey.split('+');
                                    const names = factorIds.map(getFactorName).sort().join(' + ');
                                    return (
                                        <MenuItem key={modelKey} value={modelKey}>
                                            {names}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    </Box>
                </Box>

                <TableContainer sx={{ maxHeight: 400 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Thời gian</TableCell>
                                <TableCell>Model</TableCell>
                                <TableCell align="right">Giá trị</TableCell>
                                <TableCell align="center">Kết quả</TableCell>
                                <TableCell align="center">Nội dung</TableCell>
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
                                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                            {trade.factorIds.map(getFactorName).sort().map((name) => (
                                                <Chip
                                                    key={name}
                                                    label={name}
                                                    size="small"
                                                    sx={{ fontSize: '0.7rem', height: 20 }}
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
                                            sx={{ fontWeight: 600 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        {hasContent(trade) && (
                                            <Tooltip title="Có nội dung">
                                                <NotesIcon fontSize="small" color="primary" />
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                            <Tooltip title="Chi tiết">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenDetails(trade)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Xóa">
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
                getFactorName={getFactorName}
            />
        </>
    );
}

export default TestTrades;
