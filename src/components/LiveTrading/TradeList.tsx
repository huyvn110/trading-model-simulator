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
    Grid,
    Divider,
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
import { NotionEditor, migrateToContentBlocks } from '@/components/shared/NotionEditor';

interface TradeDetailsDialogProps {
    trade: LiveTrade | null;
    open: boolean;
    onClose: () => void;
}

function TradeDetailsDialog({ trade: tradeProp, open, onClose }: TradeDetailsDialogProps) {
    const { currentSession, updateTradeContent } = useLiveSessionStore();
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

    const trade = currentSession?.trades.find(t => t.id === tradeProp?.id) || tradeProp;

    useEffect(() => {
        if (trade) {
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

    const formatLabel = (label: string, value: any) => (
        <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {value || '-'}
            </Typography>
        </Box>
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: '#111827', color: 'white', borderRadius: 2 } }}>
            <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Chi tiết Trade - {trade.modelName}
                    </Typography>
                    <Chip
                        icon={trade.result === 'win' ? <WinIcon /> : <LoseIcon />}
                        label={trade.result.toUpperCase()}
                        color={trade.result === 'win' ? 'success' : 'error'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                    />
                </Stack>
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, bgcolor: '#1e2537', borderRadius: 2 }}>
                            <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 700 }}>THÔNG TIN</Typography>
                            {formatLabel('Ngày giờ', `${trade.tradeDate} ${trade.tradeTime || ''}`)}
                            {formatLabel('Market', trade.market)}
                            {formatLabel('Session', trade.session)}
                            {formatLabel('Bias', trade.bias?.toUpperCase())}
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, bgcolor: '#1e2537', borderRadius: 2, height: '100%' }}>
                            <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 700 }}>KẾT QUẢ</Typography>
                            {formatLabel('PnL ($)', trade.pnl !== undefined ? `$${trade.pnl}` : undefined)}
                            {formatLabel('RR', trade.rr !== undefined ? `${trade.rr}R` : undefined)}
                            {formatLabel('RR Value', trade.rrValue !== undefined ? `$${trade.rrValue}` : undefined)}
                            {formatLabel('Measurement (Legacy)', trade.measurementValue !== undefined ? trade.measurementValue : undefined)}
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, bgcolor: '#1e2537', borderRadius: 2, height: '100%' }}>
                            <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 700 }}>TÂM LÝ</Typography>
                            {formatLabel('Follow Plan?', trade.followPlan?.toUpperCase())}
                            {formatLabel('Mistake', trade.mistake)}
                            {formatLabel('Emotion', trade.emotion)}
                        </Paper>
                    </Grid>
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2, bgcolor: '#1e2537', borderRadius: 2 }}>
                            <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 700 }}>GHI CHÚ & HÌNH ẢNH</Typography>
                            <Box sx={{ bgcolor: '#111827', p: 2, borderRadius: 1, minHeight: '30vh' }}>
                                <NotionEditor
                                    blocks={contentBlocks}
                                    onChange={handleContentChange}
                                    placeholder="Thêm ghi chú hoặc ảnh..."
                                    sessionId={currentSession?.id}
                                    sessionName={currentSession ? `[Live] ${currentSession.name || new Date(currentSession.startTime).toLocaleDateString('vi-VN')}` : undefined}
                                />
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', p: 2 }}>
                <Button onClick={onClose} variant="contained" sx={{ bgcolor: '#3b82f6' }}>Đóng</Button>
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

    const modelNames = Array.from(new Set(trades.map(t => t.modelName))).sort();

    const filteredTrades = filterModel === 'all'
        ? trades
        : trades.filter(t => t.modelName === filterModel);

    const formatDisplayTime = (trade: LiveTrade) => {
        if (trade.tradeDate && trade.tradeTime) {
            return `${trade.tradeDate} ${trade.tradeTime}`;
        }
        return new Date(trade.timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit', minute: '2-digit',
        });
    };

    const formatDisplayValue = (trade: LiveTrade) => {
        if (trade.pnl !== undefined) return `$${trade.pnl}`;
        if (trade.rr !== undefined) return `${trade.rr}R`;
        return trade.measurementValue !== undefined ? String(trade.measurementValue) : '-';
    };

    const handleOpenDetails = (trade: LiveTrade) => {
        setSelectedTrade(trade);
        setDetailsOpen(true);
    };

    const hasContent = (trade: LiveTrade) => {
        return (trade.content && trade.content.length > 0) ||
            trade.notes ||
            (trade.images && trade.images.length > 0);
    };

    if (trades.length === 0) {
        return (
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>Trades</Typography>
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <Typography variant="body1">No trades yet. Add your first trade.</Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>Trades</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Model</InputLabel>
                            <Select value={filterModel} label="Model" onChange={(e) => setFilterModel(e.target.value)}>
                                <MenuItem value="all">Tất cả</MenuItem>
                                {modelNames.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <Chip label={`${filteredTrades.length} trades`} size="small" variant="outlined" />
                    </Box>
                </Box>

                <TableContainer sx={{ maxHeight: 400 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Time</TableCell>
                                <TableCell>Market</TableCell>
                                <TableCell>Model</TableCell>
                                <TableCell align="right">Value (PnL/RR)</TableCell>
                                <TableCell align="center">Result</TableCell>
                                <TableCell align="center">Content</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {[...filteredTrades].reverse().map((trade) => (
                                <TableRow key={trade.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {formatDisplayTime(trade)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>
                                            {trade.market || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={trade.modelName} size="small" sx={{ fontSize: '0.75rem' }} />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" fontWeight={600} color={trade.result === 'win' ? 'success.main' : 'error.main'}>
                                            {formatDisplayValue(trade)}
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
                                                <IconButton size="small" onClick={() => handleOpenDetails(trade)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" onClick={() => deleteTrade(trade.id)} sx={{ color: 'error.main' }}>
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

            <TradeDetailsDialog trade={selectedTrade} open={detailsOpen} onClose={() => setDetailsOpen(false)} />
        </>
    );
}

export default TradeList;
