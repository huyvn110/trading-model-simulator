'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Chip,
    Alert,
    IconButton,
    Tooltip,
    Dialog,
    DialogContent,
    DialogActions,
    Badge,
    Autocomplete,
    Grid,
    Divider
} from '@mui/material';
import {
    Check as WinIcon,
    Close as LoseIcon,
    Description as NoteIcon,
} from '@mui/icons-material';
import { useModelStore } from '@/store/modelStore';
import { useLiveSessionStore } from '@/store/liveSessionStore';
import { useUploadQueueStore, PendingUpload } from '@/store/uploadQueueStore';
import { MeasurementMode, ContentBlock } from '@/types';
import { NotionEditor, extractFromContentBlocks } from '@/components/shared/NotionEditor';
import { TradeDatePicker } from '@/components/shared/TradeDatePicker';
import { isIdbImageRef } from '@/lib/imageStore';
import { v4 as uuidv4 } from 'uuid';

const COMMON_MARKETS = ['mgc', 'mNQ', 'ES', 'NQ', 'GC', 'CL'];
const SESSIONS = ['Asia', 'London', 'NY'];
const MISTAKES = ['None', 'FOMO', 'Moved SL', 'Không đợi cisd', 'Vào sớm', 'Sai cấu trúc', 'Lỗi tâm lý'];

export function TradePanel() {
    const { getSelectedModel, areAllFactorsChecked, resetChecklist } = useModelStore();
    const {
        measurementMode,
        setMeasurementMode,
        currentSession,
        addTrade,
        startSession,
    } = useLiveSessionStore();
    const { enqueue } = useUploadQueueStore();

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
    const [value, setValue] = useState<string>('');
    const [profitRatio, setProfitRatio] = useState<string>('');
    
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);
    const [autoSyncDate, setAutoSyncDate] = useState(true);
    const [initialBalance, setInitialBalance] = useState<string>('1000');

    const selectedModel = getSelectedModel();
    const isSessionActive = !!currentSession;
    const allFactorsChecked = selectedModel ? areAllFactorsChecked(selectedModel.id) : false;

    // Auto-sync date to current when enabled
    useEffect(() => {
        if (autoSyncDate) {
            setTradeDate(new Date().toISOString().split('T')[0]);
            setTradeTime(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
        }
    }, [autoSyncDate]);

    const handleAddTrade = (result: 'win' | 'lose') => {
        if (!selectedModel) return;

        // Legacy compatibility (if user still uses MeasurementMode)
        let numValue = parseFloat(value);
        if (isNaN(numValue)) numValue = 0;
        let numProfitRatio = profitRatio ? parseFloat(profitRatio) : undefined;

        // New explicit fields
        const numPnL = pnl ? parseFloat(pnl) : undefined;
        const numRR = rr ? parseFloat(rr) : undefined;
        const numRRValue = rrValue ? parseFloat(rrValue) : undefined;

        // Ensure we have at least legacy value if PnL is empty, to not break old logic
        // But if PnL is provided, we can rely on it.
        if (!numPnL && !numValue) {
            // Require at least something if no PnL
            // return;
        }

        const { notes, images } = extractFromContentBlocks(contentBlocks);

        addTrade({
            modelId: selectedModel.id,
            modelName: selectedModel.name,
            result,
            tradeDate,
            tradeTime,
            market,
            session,
            bias,
            pnl: numPnL,
            rr: numRR,
            rrValue: numRRValue,
            measurementValue: numValue,
            profitRatio: numProfitRatio,
            followPlan,
            emotion,
            mistake,
            notes: notes.trim() || undefined,
            images: images.length > 0 ? images : undefined,
            content: contentBlocks.length > 0 ? contentBlocks : undefined
        });

        const liveState = useLiveSessionStore.getState();
        const trades = liveState.currentSession?.trades || [];
        const newTrade = trades[trades.length - 1];

        if (newTrade && contentBlocks.length > 0) {
            const pendingUploads: PendingUpload[] = [];
            contentBlocks.forEach((block) => {
                if (block.type === 'image' && isIdbImageRef(block.value)) {
                    pendingUploads.push({
                        id: uuidv4(),
                        idbKey: block.value.replace('idb://', ''),
                        idbRef: block.value,
                        sessionId: liveState.currentSession?.id,
                        sessionName: liveState.currentSession
                            ? `[Live] ${new Date(liveState.currentSession.startTime).toLocaleDateString('vi-VN')}_${new Date(liveState.currentSession.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h')}`
                            : undefined,
                        status: 'pending',
                        retryCount: 0,
                        createdAt: Date.now(),
                        storeType: 'live',
                        tradeId: newTrade.id,
                    });
                }
            });

            if (pendingUploads.length > 0) {
                enqueue(pendingUploads);
            }
        }

        // Reset checklist and form after trade
        resetChecklist(selectedModel.id);
        setValue('');
        setProfitRatio('');
        setPnl('');
        setRr('');
        setRrValue('');
        setEmotion('');
        setContentBlocks([]);
        if (!mistake || mistake === 'None') setMistake('');
    };

    return (
        <Box
            className="glass-card"
            sx={{
                p: 2.5,
                borderRadius: 3,
                transition: 'all 0.3s ease'
            }}
        >
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Add Trade
            </Typography>

            <Stack spacing={2.5}>
                {/* Initial Balance & Start Session */}
                {!isSessionActive && (
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Số dư ban đầu
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={initialBalance}
                            onChange={(e) => setInitialBalance(e.target.value)}
                            placeholder="VD: 1000"
                            sx={{ mb: 1.5 }}
                        />
                        <Button
                            variant="contained"
                            fullWidth
                            color="success"
                            onClick={() => startSession(parseFloat(initialBalance) || 0)}
                        >
                            🚀 Bắt Đầu Phiên Giao Dịch
                        </Button>
                    </Box>
                )}

                {/* 1. Basic Info */}
                <Box>
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700 }}>
                        Thông tin cơ bản
                    </Typography>
                    <Grid container spacing={1.5}>
                        <Grid item xs={6}>
                            <TradeDatePicker
                                value={tradeDate}
                                onChange={setTradeDate}
                                autoSync={autoSyncDate}
                                onAutoSyncChange={setAutoSyncDate}
                                showAutoSync={true}
                            />
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
                                options={COMMON_MARKETS}
                                value={market}
                                onInputChange={(_, newValue) => setMarket(newValue)}
                                renderInput={(params) => <TextField {...params} label="Market" size="small" />}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Autocomplete
                                freeSolo
                                options={SESSIONS}
                                value={session}
                                onInputChange={(_, newValue) => setSession(newValue)}
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
                                <ToggleButton value="long" sx={{ fontWeight: 600, color: 'success.main', '&.Mui-selected': { bgcolor: 'success.light', color: 'success.dark' } }}>Long</ToggleButton>
                                <ToggleButton value="short" sx={{ fontWeight: 600, color: 'error.main', '&.Mui-selected': { bgcolor: 'error.light', color: 'error.dark' } }}>Short</ToggleButton>
                            </ToggleButtonGroup>
                        </Grid>
                    </Grid>
                </Box>

                <Divider />

                {/* 2. Setup & Strategy */}
                <Box>
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700 }}>
                        Setup (Model & Factor)
                    </Typography>
                    {selectedModel ? (
                        <Chip label={selectedModel.name} color="primary" sx={{ fontWeight: 500, width: '100%', justifyContent: 'flex-start', mb: 1 }} />
                    ) : (
                        <Alert severity="info" sx={{ py: 0.5, mb: 1 }}>Chọn một Model từ danh sách bên cạnh</Alert>
                    )}
                    
                    {selectedModel && selectedModel.factors.length > 0 && !allFactorsChecked && (
                        <Alert severity="warning" sx={{ py: 0.5 }}>Vui lòng check hết factors trước khi trade!</Alert>
                    )}
                </Box>

                <Divider />

                {/* 3. Performance & Results */}
                <Box>
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700 }}>
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

                <Divider />

                {/* 4. Psychology & Review */}
                <Box>
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700 }}>
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
                                options={MISTAKES}
                                value={mistake}
                                onInputChange={(_, newValue) => setMistake(newValue)}
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

                {/* Note */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Nhật ký hình ảnh / Ghi chú:
                    </Typography>
                    <Tooltip title="Chỉnh sửa ghi chú">
                        <IconButton
                            onClick={() => setNoteDialogOpen(true)}
                            sx={{
                                color: contentBlocks.length > 0 ? 'primary.main' : 'grey.500',
                                bgcolor: contentBlocks.length > 0 ? 'primary.light' : 'grey.100',
                            }}
                        >
                            <Badge badgeContent={contentBlocks.length > 0 ? '✓' : null} color="success">
                                <NoteIcon />
                            </Badge>
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Submit Buttons */}
                <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
                    <Button
                        variant="contained" color="success" fullWidth size="large"
                        startIcon={<WinIcon />}
                        onClick={() => handleAddTrade('win')}
                        disabled={!selectedModel || !allFactorsChecked}
                        sx={{
                            py: 1.5, fontWeight: 800, fontSize: '0.95rem', borderRadius: 2.5,
                            background: (!selectedModel || !allFactorsChecked) ? undefined : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        }}
                    >
                        WIN
                    </Button>
                    <Button
                        variant="contained" color="error" fullWidth size="large"
                        startIcon={<LoseIcon />}
                        onClick={() => handleAddTrade('lose')}
                        disabled={!selectedModel || !allFactorsChecked}
                        sx={{
                            py: 1.5, fontWeight: 800, fontSize: '0.95rem', borderRadius: 2.5,
                            background: (!selectedModel || !allFactorsChecked) ? undefined : 'linear-gradient(135deg, #be123c 0%, #f43f5e 100%)',
                        }}
                    >
                        LOSE
                    </Button>
                </Stack>
            </Stack>

            {/* Note Dialog */}
            <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: '#191919', color: 'white', minHeight: '70vh', borderRadius: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderBottom: '1px solid #2f2f2f' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>Ghi chú Trade</Typography>
                    <IconButton onClick={() => setNoteDialogOpen(false)} sx={{ color: '#9f9f9f' }}><LoseIcon /></IconButton>
                </Box>
                <DialogContent sx={{ bgcolor: '#191919', px: 4, py: 3 }}>
                    <Box sx={{ bgcolor: '#1e1e1e', borderRadius: 2, p: 2, minHeight: '45vh', border: '1px solid #2f2f2f' }}>
                        <NotionEditor blocks={contentBlocks} onChange={setContentBlocks} sessionId={currentSession?.id} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ bgcolor: '#191919', borderTop: '1px solid #2f2f2f', px: 3, py: 2 }}>
                    <Button onClick={() => setContentBlocks([])} sx={{ color: '#ff6b6b' }}>Xóa</Button>
                    <Button onClick={() => setNoteDialogOpen(false)} variant="contained" sx={{ bgcolor: '#3b82f6' }}>Xong</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default TradePanel;
