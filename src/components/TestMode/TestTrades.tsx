'use client';

import React, { useState, useRef } from 'react';
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
import { useTestSessionStore, TestTrade } from '@/store/testSessionStore';
import { useFactorStore } from '@/store/factorStore';

interface TradeDetailsDialogProps {
    trade: TestTrade | null;
    open: boolean;
    onClose: () => void;
    getFactorName: (id: string) => string;
}

function TradeDetailsDialog({ trade, open, onClose, getFactorName }: TradeDetailsDialogProps) {
    const { updateTradeNotes, addTradeImage, removeTradeImage } = useTestSessionStore();
    const [notes, setNotes] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (trade) {
            setNotes(trade.notes || '');
        }
    }, [trade]);

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

    if (!trade) return null;

    // Resolve factor names from IDs
    const factorNames = trade.factorIds.map(getFactorName).sort();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Chi tiết Trade
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Model
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {factorNames.map((name) => (
                                <Chip key={name} label={name} size="small" color="primary" />
                            ))}
                        </Stack>
                    </Box>

                    <TextField
                        label="Ghi chú"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        onBlur={handleSaveNotes}
                        multiline
                        rows={3}
                        fullWidth
                        placeholder="Thêm ghi chú..."
                    />

                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Ảnh
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
                                <TableCell align="center">Ghi chú</TableCell>
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
                                        <Stack direction="row" spacing={0.5} justifyContent="center">
                                            {trade.notes && (
                                                <Tooltip title="Có ghi chú">
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
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                            <Tooltip title="Chi tiết">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenDetails(trade)}
                                                >
                                                    <NotesIcon fontSize="small" />
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
