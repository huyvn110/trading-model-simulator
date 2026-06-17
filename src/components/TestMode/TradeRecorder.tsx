'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Stack,
    Alert,
    Chip,
    IconButton,
    Tooltip,
    Dialog,
    DialogContent,
    DialogActions,
    Badge,
    useTheme,
    alpha,
} from '@mui/material';
import {
    Check as WinIcon,
    Close as LoseIcon,
    Description as NoteIcon,
    FlashOn as FlashIcon,
} from '@mui/icons-material';
import { useTestSessionStore } from '@/store/testSessionStore';
import { useFactorStore } from '@/store/factorStore';
import { NotionEditor, extractFromContentBlocks } from '@/components/shared/NotionEditor';
import { TradeDatePicker } from '@/components/shared/TradeDatePicker';
import { ContentBlock } from '@/types';
import { FACTOR_COLORS } from '@/theme/theme';

export function TradeRecorder() {
    const { currentSession, addTrade } = useTestSessionStore();
    const { factors } = useFactorStore();
    const selectedFactors = factors.filter(f => f.selected);

    const [value, setValue] = useState('');
    const [profitRatio, setProfitRatio] = useState('');
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);
    const [tradeDate, setTradeDate] = useState(new Date().toISOString().split('T')[0]);

    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const measurementMode = currentSession?.measurementMode || 'RR';

    const isReady = selectedFactors.length > 0 && !!value && parseFloat(value) > 0;

    const getValueLabel = () => ({
        RR: 'Giá trị [RR]', $: 'Giá trị [$]', '%': 'Giá trị [%]',
    }[measurementMode]);

    const getProfitLabel = () => measurementMode === 'RR' ? 'Tỷ lệ lời (x)' : 'Tỷ lệ lời (%)';
    const getProfitPlaceholder = () => measurementMode === 'RR' ? 'VD: 1.5 (= 1.5x)' : 'VD: 50 (= 50%)';

    const handleRecordTrade = (result: 'win' | 'lose') => {
        if (!currentSession || selectedFactors.length === 0 || !value) return;
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) return;

        let finalValue = numValue;
        if (result === 'win' && profitRatio) {
            const ratio = parseFloat(profitRatio);
            if (!isNaN(ratio) && ratio > 0) {
                finalValue = measurementMode === 'RR'
                    ? numValue * ratio
                    : numValue * (1 + ratio / 100);
            }
        }

        const { notes, images } = extractFromContentBlocks(contentBlocks);
        addTrade(
            selectedFactors, finalValue, result, tradeDate,
            notes || undefined,
            images.length > 0 ? images : undefined,
            contentBlocks.length > 0 ? contentBlocks : undefined,
        );

        setValue('');
        setProfitRatio('');
        setContentBlocks([]);
        setTradeDate(new Date().toISOString().split('T')[0]);
    };

    if (!currentSession) {
        return (
            <Box className="glass-card" sx={{ p: 2.5, borderRadius: 3 }}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Tạo hoặc chọn phiên test để bắt đầu ghi trade
                </Alert>
            </Box>
        );
    }

    return (
        <Box className="glass-card" sx={{ p: 2.5, pt: 2, borderRadius: 3, transition: 'all 0.3s ease' }}>
            <Stack spacing={2}>
                {/* ── Selected Factor Chips ── */}
                <Box>
                    <Typography variant="caption" sx={{
                        color: 'text.secondary', fontWeight: 600, fontSize: '0.72rem',
                        textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75, display: 'block',
                    }}>
                        Factors đã chọn
                    </Typography>
                    {selectedFactors.length > 0 ? (
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            {selectedFactors.map((f, idx) => {
                                const fc = FACTOR_COLORS[
                                    factors.findIndex(ff => ff.id === f.id) % FACTOR_COLORS.length
                                ];
                                return (
                                    <Chip
                                        key={f.id}
                                        label={f.name}
                                        size="small"
                                        sx={{
                                            bgcolor: fc.light,
                                            color: fc.text,
                                            border: `1px solid ${alpha(fc.bg, 0.35)}`,
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                            height: 26,
                                            '& .MuiChip-label': { px: 1.25 },
                                        }}
                                    />
                                );
                            })}
                        </Stack>
                    ) : (
                        <Alert severity="warning" sx={{ py: 0.5, fontSize: '0.8rem' }}>
                            Chọn ít nhất 1 factor ở trên
                        </Alert>
                    )}
                </Box>

                {/* ── Trade Date ── */}
                <TradeDatePicker value={tradeDate} onChange={setTradeDate} showAutoSync={false} />

                {/* ── Value Inputs ── */}
                <Stack direction="row" spacing={1.5}>
                    <TextField
                        label={getValueLabel()}
                        type="number"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="0.00"
                        inputProps={{ min: 0, step: 0.1 }}
                    />
                    <TextField
                        label={getProfitLabel()}
                        type="number"
                        value={profitRatio}
                        onChange={e => setProfitRatio(e.target.value)}
                        size="small"
                        fullWidth
                        placeholder={getProfitPlaceholder()}
                        inputProps={{ min: 0, step: 0.1 }}
                    />
                </Stack>

                {/* ── Note Button ── */}
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Tooltip title={contentBlocks.length > 0 ? 'Chỉnh sửa ghi chú' : 'Thêm ghi chú'} arrow>
                        <IconButton
                            onClick={() => setNoteDialogOpen(true)}
                            size="small"
                            sx={{
                                width: 34, height: 34,
                                border: '1px solid',
                                borderColor: contentBlocks.length > 0
                                    ? alpha('#2383e2', 0.4)
                                    : 'divider',
                                bgcolor: contentBlocks.length > 0
                                    ? alpha('#2383e2', 0.1)
                                    : 'transparent',
                                '&:hover': {
                                    bgcolor: contentBlocks.length > 0
                                        ? alpha('#2383e2', 0.18)
                                        : 'action.hover',
                                },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Badge
                                variant="dot"
                                invisible={contentBlocks.length === 0}
                                color="primary"
                                sx={{ '& .MuiBadge-dot': { width: 6, height: 6, top: 2, right: 2 } }}
                            >
                                <NoteIcon sx={{
                                    fontSize: 17,
                                    color: contentBlocks.length > 0 ? '#2383e2' : 'text.secondary',
                                }} />
                            </Badge>
                        </IconButton>
                    </Tooltip>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {contentBlocks.length > 0 ? (
                            <span style={{ color: '#2383e2' }}>✓ Đã có ghi chú</span>
                        ) : 'Thêm ghi chú (tùy chọn)'}
                    </Typography>
                </Stack>

                {/* ── Note Dialog ── */}
                <Dialog
                    open={noteDialogOpen}
                    onClose={() => setNoteDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: {
                            bgcolor: '#111827',
                            color: 'white',
                            minHeight: '70vh',
                            maxHeight: '85vh',
                            borderRadius: 3,
                            border: '1px solid rgba(241,245,249,0.08)',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
                        },
                    }}
                >
                    <Box sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        px: 3, py: 2, borderBottom: '1px solid rgba(241,245,249,0.08)',
                    }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box sx={{
                                width: 32, height: 32, borderRadius: 2,
                                background: 'linear-gradient(135deg, #2383e2, #8b5cf6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <NoteIcon sx={{ color: 'white', fontSize: 17 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                                Ghi chú Trade
                            </Typography>
                        </Stack>
                        <IconButton onClick={() => setNoteDialogOpen(false)} sx={{ color: 'rgba(148,163,184,0.8)' }}>
                            <LoseIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Box>

                    <DialogContent sx={{ bgcolor: '#111827', px: 4, py: 3, flex: 1, overflowY: 'auto' }}>
                        <Box sx={{
                            bgcolor: '#1e2537', borderRadius: 2, p: 2,
                            minHeight: '45vh', border: '1px solid rgba(241,245,249,0.08)',
                        }}>
                            <NotionEditor
                                blocks={contentBlocks}
                                onChange={setContentBlocks}
                                placeholder="Type '/' for commands, or start typing..."
                                sessionId={currentSession?.id}
                                sessionName={currentSession ? `[Test] ${currentSession.name}_${new Date(currentSession.startTime).toLocaleDateString('vi-VN')}` : undefined}
                            />
                        </Box>
                    </DialogContent>

                    <DialogActions sx={{
                        bgcolor: '#111827', borderTop: '1px solid rgba(241,245,249,0.08)',
                        px: 3, py: 2, gap: 1,
                    }}>
                        <Button onClick={() => setContentBlocks([])} sx={{ color: '#f43f5e' }}>
                            Xóa ghi chú
                        </Button>
                        <Button
                            onClick={() => setNoteDialogOpen(false)}
                            variant="contained"
                            sx={{ bgcolor: '#2383e2', '&:hover': { bgcolor: '#1a6bc2' }, px: 3 }}
                        >
                            Lưu & Đóng
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* ── WIN / LOSE Buttons ── */}
                <Stack direction="row" spacing={1.5}>
                    <Button
                        variant="contained"
                        fullWidth
                        color="success"
                        startIcon={<WinIcon />}
                        onClick={() => handleRecordTrade('win')}
                        disabled={!isReady}
                        className={isReady ? 'btn-win-active' : ''}
                        sx={{
                            py: 1.5, fontWeight: 800, fontSize: '0.95rem',
                            borderRadius: 2.5, letterSpacing: '0.05em',
                            background: isReady
                                ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                                : undefined,
                            '&:not(:disabled):hover': {
                                background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
                                transform: 'translateY(-2px)',
                            },
                        }}
                    >
                        WIN
                    </Button>
                    <Button
                        variant="contained"
                        fullWidth
                        color="error"
                        startIcon={<LoseIcon />}
                        onClick={() => handleRecordTrade('lose')}
                        disabled={!isReady}
                        className={isReady ? 'btn-lose-active' : ''}
                        sx={{
                            py: 1.5, fontWeight: 800, fontSize: '0.95rem',
                            borderRadius: 2.5, letterSpacing: '0.05em',
                            background: isReady
                                ? 'linear-gradient(135deg, #be123c 0%, #f43f5e 100%)'
                                : undefined,
                            '&:not(:disabled):hover': {
                                background: 'linear-gradient(135deg, #9f1239 0%, #be123c 100%)',
                                transform: 'translateY(-2px)',
                            },
                        }}
                    >
                        LOSE
                    </Button>
                </Stack>

                {/* ── Trade Count Card ── */}
                <Box className="hover-lift" sx={{
                    textAlign: 'center', py: 1.75, borderRadius: 2.5,
                    background: isDark
                        ? 'linear-gradient(135deg, rgba(35,131,226,0.12) 0%, rgba(139,92,246,0.08) 100%)'
                        : 'linear-gradient(135deg, rgba(35,131,226,0.07) 0%, rgba(139,92,246,0.05) 100%)',
                    border: '1px solid',
                    borderColor: isDark ? alpha('#2383e2', 0.2) : alpha('#2383e2', 0.12),
                    position: 'relative', overflow: 'hidden',
                }}>
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <FlashIcon sx={{ fontSize: 18, color: '#fbbf24' }} />
                        <Typography className="num" sx={{
                            fontWeight: 900, fontSize: '1.75rem', letterSpacing: '-0.04em',
                            background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            {currentSession.trades.length}
                        </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        trades đã ghi
                    </Typography>
                </Box>
            </Stack>
        </Box>
    );
}

export default TradeRecorder;
