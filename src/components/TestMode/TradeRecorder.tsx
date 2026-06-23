'use client';

import React, { useState, useEffect } from 'react';
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
    Autocomplete,
    Grid,
    Divider,
    ToggleButtonGroup,
    ToggleButton
} from '@mui/material';
import {
    Check as WinIcon,
    Close as LoseIcon,
    Description as NoteIcon,
    FlashOn as FlashIcon,
} from '@mui/icons-material';
import { useTestSessionStore } from '@/store/testSessionStore';
import { useFactorStore } from '@/store/factorStore';
import { useUploadQueueStore, PendingUpload } from '@/store/uploadQueueStore';
import { NotionEditor, extractFromContentBlocks } from '@/components/shared/NotionEditor';
import { TradeDatePicker } from '@/components/shared/TradeDatePicker';
import { ContentBlock } from '@/types';
import { FACTOR_COLORS } from '@/theme/theme';
import { isIdbImageRef } from '@/lib/imageStore';
import { v4 as uuidv4 } from 'uuid';

const COMMON_MARKETS = ['mgc', 'mNQ', 'ES', 'NQ', 'GC', 'CL'];
const SESSIONS = ['Asia', 'London', 'NY'];
const MISTAKES = ['None', 'FOMO', 'Moved SL', 'Không đợi cisd', 'Vào sớm', 'Sai cấu trúc', 'Lỗi tâm lý'];

export function TradeRecorder() {
    const { currentSession, sessionHistory, addTrade } = useTestSessionStore();
    const { factors } = useFactorStore();
    const { enqueue } = useUploadQueueStore();
    const selectedFactors = factors.filter(f => f.selected);

    // Extract dynamic options from history
    const allTrades = [...(currentSession?.trades || []), ...sessionHistory.flatMap(s => s.trades)];
    const uniqueMarkets = Array.from(new Set([...COMMON_MARKETS, ...allTrades.map(t => t.market).filter(Boolean) as string[]]));
    const uniqueSessions = Array.from(new Set([...SESSIONS, ...allTrades.map(t => t.session).filter(Boolean) as string[]]));
    const uniqueMistakes = Array.from(new Set([...MISTAKES, ...allTrades.map(t => t.mistake).filter(Boolean) as string[]]));

    // Form state
    const [tradeDate, setTradeDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [tradeTime, setTradeTime] = useState<string>(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    const [market, setMarket] = useState<string>('');
    const [session, setSession] = useState<string>('');
    const [bias, setBias] = useState<'long' | 'short'>('long');

    // Performance
    const [pnl, setPnl] = useState<string>('');
    const [rr, setRr] = useState<string>('');
    const [rrValue, setRrValue] = useState<string>('');

    // Psychology
    const [followPlan, setFollowPlan] = useState<'yes' | 'no'>('yes');
    const [emotion, setEmotion] = useState<string>('');
    const [mistake, setMistake] = useState<string>('');

    // Legacy values
    const [value, setValue] = useState('');
    const [profitRatio, setProfitRatio] = useState('');
    
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);

    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const measurementMode = currentSession?.measurementMode || 'RR';

    const isReady = selectedFactors.length > 0;

    const handleRecordTrade = (result: 'win' | 'lose') => {
        if (!currentSession || selectedFactors.length === 0) return;
        
        let numValue = parseFloat(value);
        if (isNaN(numValue)) numValue = 0;

        let finalValue = numValue;
        if (result === 'win' && profitRatio) {
            const ratio = parseFloat(profitRatio);
            if (!isNaN(ratio) && ratio > 0) {
                finalValue = measurementMode === 'RR'
                    ? numValue * ratio
                    : numValue * (1 + ratio / 100);
            }
        }

        const numPnL = pnl ? parseFloat(pnl) : undefined;
        const numRR = rr ? parseFloat(rr) : undefined;
        const numRRValue = rrValue ? parseFloat(rrValue) : undefined;

        const { notes, images } = extractFromContentBlocks(contentBlocks);
        
        addTrade({
            factors: selectedFactors,
            result,
            tradeDate,
            tradeTime,
            market,
            session,
            bias,
            pnl: numPnL,
            rr: numRR,
            rrValue: numRRValue,
            measurementValue: finalValue,
            followPlan,
            emotion,
            mistake,
            notes: notes || undefined,
            images: images.length > 0 ? images : undefined,
            content: contentBlocks.length > 0 ? contentBlocks : undefined,
        });

        const testState = useTestSessionStore.getState();
        const trades = testState.currentSession?.trades || [];
        const newTrade = trades[trades.length - 1];

        if (newTrade && contentBlocks.length > 0) {
            const pendingUploads: PendingUpload[] = [];
            contentBlocks.forEach((block) => {
                if (block.type === 'image' && isIdbImageRef(block.value)) {
                    pendingUploads.push({
                        id: uuidv4(),
                        idbKey: block.value.replace('idb://', ''),
                        idbRef: block.value,
                        sessionId: testState.currentSession?.id,
                        sessionName: testState.currentSession
                            ? `[Test] ${testState.currentSession.name}_${new Date(testState.currentSession.startTime).toLocaleDateString('vi-VN')}`
                            : undefined,
                        status: 'pending',
                        retryCount: 0,
                        createdAt: Date.now(),
                        storeType: 'test',
                        tradeId: newTrade.id,
                    });
                }
            });

            if (pendingUploads.length > 0) {
                enqueue(pendingUploads);
            }
        }

        setValue('');
        setProfitRatio('');
        setPnl('');
        setRr('');
        setRrValue('');
        setEmotion('');
        setContentBlocks([]);
        // setTradeDate(new Date().toISOString().split('T')[0]); // Optional auto reset date
        if (!mistake || mistake === 'None') setMistake('');
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

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

                {/* 1. Basic Info */}
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: '#2383e2' }}>
                        Thông tin cơ bản
                    </Typography>
                    <Grid container spacing={1.5}>
                        <Grid item xs={6}>
                            <TradeDatePicker value={tradeDate} onChange={setTradeDate} showAutoSync={false} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Time"
                                type="time"
                                value={tradeTime}
                                onChange={(e) => setTradeTime(e.target.value)}
                                size="small"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Autocomplete
                                freeSolo
                                options={uniqueMarkets}
                                value={market}
                                onChange={(_, newValue) => setMarket(newValue || '')}
                                onInputChange={(_, newInputValue) => setMarket(newInputValue)}
                                renderInput={(params) => <TextField {...params} label="Market" size="small" />}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Autocomplete
                                freeSolo
                                options={uniqueSessions}
                                value={session}
                                onChange={(_, newValue) => setSession(newValue || '')}
                                onInputChange={(_, newInputValue) => setSession(newInputValue)}
                                renderInput={(params) => <TextField {...params} label="Session" size="small" />}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <ToggleButtonGroup
                                value={bias}
                                exclusive
                                onChange={(_, newBias) => newBias && setBias(newBias)}
                                fullWidth
                                size="small"
                            >
                                <ToggleButton value="long" sx={{ fontWeight: 600, color: 'success.main', '&.Mui-selected': { bgcolor: alpha('#10b981', 0.2), color: '#10b981' } }}>Long</ToggleButton>
                                <ToggleButton value="short" sx={{ fontWeight: 600, color: 'error.main', '&.Mui-selected': { bgcolor: alpha('#f43f5e', 0.2), color: '#f43f5e' } }}>Short</ToggleButton>
                            </ToggleButtonGroup>
                        </Grid>
                    </Grid>
                </Box>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

                {/* 3. Performance & Results */}
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: '#2383e2' }}>
                        Kết quả & Lợi nhuận
                    </Typography>
                    <Grid container spacing={1.5}>
                        <Grid item xs={4}>
                            <TextField label="PnL ($)" type="number" value={pnl} onChange={(e) => setPnl(e.target.value)} size="small" fullWidth />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField label="RR" type="number" value={rr} onChange={(e) => setRr(e.target.value)} size="small" fullWidth />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField label="RR Value" type="number" value={rrValue} onChange={(e) => setRrValue(e.target.value)} size="small" fullWidth />
                        </Grid>
                    </Grid>
                </Box>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

                {/* 4. Psychology & Review */}
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: '#2383e2' }}>
                        Tâm lý & Đánh giá
                    </Typography>
                    <Grid container spacing={1.5}>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Có Follow đúng Plan không?
                            </Typography>
                            <ToggleButtonGroup
                                value={followPlan}
                                exclusive
                                onChange={(_, newValue) => newValue && setFollowPlan(newValue)}
                                fullWidth
                                size="small"
                            >
                                <ToggleButton value="yes" sx={{ fontWeight: 600 }}>Yes</ToggleButton>
                                <ToggleButton value="no" sx={{ fontWeight: 600 }}>No</ToggleButton>
                            </ToggleButtonGroup>
                        </Grid>
                        <Grid item xs={12}>
                            <Autocomplete
                                freeSolo
                                options={uniqueMistakes}
                                value={mistake}
                                onChange={(_, newValue) => setMistake(newValue || '')}
                                onInputChange={(_, newInputValue) => setMistake(newInputValue)}
                                renderInput={(params) => <TextField {...params} label="Lỗi / Mistake" size="small" />}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Cảm xúc (Emotion)"
                                value={emotion}
                                onChange={(e) => setEmotion(e.target.value)}
                                size="small"
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* ── Note Button ── */}
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Tooltip title={contentBlocks.length > 0 ? 'Chỉnh sửa ghi chú' : 'Thêm ghi chú'} arrow>
                        <IconButton
                            onClick={() => setNoteDialogOpen(true)}
                            size="small"
                            sx={{
                                width: 34, height: 34,
                                border: '1px solid',
                                borderColor: contentBlocks.length > 0 ? alpha('#2383e2', 0.4) : 'divider',
                                bgcolor: contentBlocks.length > 0 ? alpha('#2383e2', 0.1) : 'transparent',
                                '&:hover': { bgcolor: contentBlocks.length > 0 ? alpha('#2383e2', 0.18) : 'action.hover' },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Badge
                                variant="dot"
                                invisible={contentBlocks.length === 0}
                                color="primary"
                                sx={{ '& .MuiBadge-dot': { width: 6, height: 6, top: 2, right: 2 } }}
                            >
                                <NoteIcon sx={{ fontSize: 17, color: contentBlocks.length > 0 ? '#2383e2' : 'text.secondary' }} />
                            </Badge>
                        </IconButton>
                    </Tooltip>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {contentBlocks.length > 0 ? (
                            <span style={{ color: '#2383e2' }}>✓ Đã có ghi chú hình ảnh</span>
                        ) : 'Nhật ký hình ảnh (tùy chọn)'}
                    </Typography>
                </Stack>

                {/* ── WIN / LOSE Buttons ── */}
                <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
                    <Button
                        variant="contained" fullWidth color="success" startIcon={<WinIcon />}
                        onClick={() => handleRecordTrade('win')}
                        disabled={!isReady}
                        className={isReady ? 'btn-win-active' : ''}
                        sx={{
                            py: 1.5, fontWeight: 800, fontSize: '0.95rem', borderRadius: 2.5, letterSpacing: '0.05em',
                            background: isReady ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : undefined,
                        }}
                    >
                        WIN
                    </Button>
                    <Button
                        variant="contained" fullWidth color="error" startIcon={<LoseIcon />}
                        onClick={() => handleRecordTrade('lose')}
                        disabled={!isReady}
                        className={isReady ? 'btn-lose-active' : ''}
                        sx={{
                            py: 1.5, fontWeight: 800, fontSize: '0.95rem', borderRadius: 2.5, letterSpacing: '0.05em',
                            background: isReady ? 'linear-gradient(135deg, #be123c 0%, #f43f5e 100%)' : undefined,
                        }}
                    >
                        LOSE
                    </Button>
                </Stack>

                {/* ── Note Dialog ── */}
                <Dialog
                    open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="md" fullWidth
                    PaperProps={{ sx: { bgcolor: '#111827', color: 'white', minHeight: '70vh', borderRadius: 3, border: '1px solid rgba(241,245,249,0.08)', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' } }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderBottom: '1px solid rgba(241,245,249,0.08)' }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box sx={{ width: 32, height: 32, borderRadius: 2, background: 'linear-gradient(135deg, #2383e2, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <NoteIcon sx={{ color: 'white', fontSize: 17 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                                Ghi chú Trade
                            </Typography>
                        </Stack>
                        <IconButton onClick={() => setNoteDialogOpen(false)} sx={{ color: 'rgba(148,163,184,0.8)' }}><LoseIcon sx={{ fontSize: 20 }} /></IconButton>
                    </Box>
                    <DialogContent sx={{ bgcolor: '#111827', px: 4, py: 3, flex: 1, overflowY: 'auto' }}>
                        <Box sx={{ bgcolor: '#1e2537', borderRadius: 2, p: 2, minHeight: '45vh', border: '1px solid rgba(241,245,249,0.08)' }}>
                            <NotionEditor blocks={contentBlocks} onChange={setContentBlocks} sessionId={currentSession?.id} sessionName={currentSession ? `[Test] ${currentSession.name}_${new Date(currentSession.startTime).toLocaleDateString('vi-VN')}` : undefined} />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ bgcolor: '#111827', borderTop: '1px solid rgba(241,245,249,0.08)', px: 3, py: 2, gap: 1 }}>
                        <Button onClick={() => setContentBlocks([])} sx={{ color: '#f43f5e' }}>Xóa ghi chú</Button>
                        <Button onClick={() => setNoteDialogOpen(false)} variant="contained" sx={{ bgcolor: '#2383e2', '&:hover': { bgcolor: '#1a6bc2' }, px: 3 }}>Lưu & Đóng</Button>
                    </DialogActions>
                </Dialog>

                {/* ── Trade Count Card ── */}
                <Box className="hover-lift" sx={{
                    textAlign: 'center', py: 1.75, borderRadius: 2.5,
                    background: isDark ? 'linear-gradient(135deg, rgba(35,131,226,0.12) 0%, rgba(139,92,246,0.08) 100%)' : 'linear-gradient(135deg, rgba(35,131,226,0.07) 0%, rgba(139,92,246,0.05) 100%)',
                    border: '1px solid', borderColor: isDark ? alpha('#2383e2', 0.2) : alpha('#2383e2', 0.12), position: 'relative', overflow: 'hidden',
                }}>
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <FlashIcon sx={{ fontSize: 18, color: '#fbbf24' }} />
                        <Typography className="num" sx={{
                            fontWeight: 900, fontSize: '1.75rem', letterSpacing: '-0.04em',
                            background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
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
