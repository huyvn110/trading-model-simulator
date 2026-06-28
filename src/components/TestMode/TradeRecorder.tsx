'use client';

import React, { useState } from 'react';
import {
    Alert,
    Badge,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    Grid,
    IconButton,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Check as WinIcon,
    Close as LoseIcon,
    Description as NoteIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { CustomAutocomplete } from '@/components/shared/CustomAutocomplete';
import { NotionEditor, extractFromContentBlocks } from '@/components/shared/NotionEditor';
import { TradeDatePicker } from '@/components/shared/TradeDatePicker';
import { isIdbImageRef } from '@/lib/imageStore';
import { useFactorStore } from '@/store/factorStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTestSessionStore } from '@/store/testSessionStore';
import { PendingUpload, useUploadQueueStore } from '@/store/uploadQueueStore';
import { ContentBlock } from '@/types';

function parseOptional(value: string) {
    if (!value.trim()) return undefined;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export function TradeRecorder() {
    const theme = useTheme();
    const { currentSession, addTrade } = useTestSessionStore();
    const { factors } = useFactorStore();
    const { enqueue } = useUploadQueueStore();
    const {
        markets,
        addMarket,
        removeMarket,
        sessions: sessionList,
        addSession,
        removeSession,
        mistakes,
        addMistake,
        removeMistake,
    } = useSettingsStore();

    const selectedFactors = factors.filter((factor) => factor.selected);
    const [tradeDate, setTradeDate] = useState(new Date().toISOString().split('T')[0]);
    const [tradeTime, setTradeTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    const [market, setMarket] = useState('');
    const [session, setSession] = useState('');
    const [bias, setBias] = useState<'long' | 'short'>('long');
    const [pnl, setPnl] = useState('');
    const [rr, setRr] = useState('');
    const [rrValue, setRrValue] = useState('');
    const [followPlan, setFollowPlan] = useState<'yes' | 'no'>('yes');
    const [emotion, setEmotion] = useState('');
    const [mistake, setMistake] = useState('');
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);

    const isReady = !!currentSession && selectedFactors.length > 0;
    const hasContent = contentBlocks.length > 0;

    const handleRecordTrade = (result: 'win' | 'lose') => {
        if (!currentSession || selectedFactors.length === 0) return;

        const numPnL = parseOptional(pnl);
        const numRR = parseOptional(rr);
        const numRRValue = parseOptional(rrValue);
        const legacyValue = Math.abs(numRR ?? numPnL ?? 0);
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
            measurementValue: legacyValue,
            followPlan,
            emotion,
            mistake,
            notes: notes.trim() || undefined,
            images: images.length > 0 ? images : undefined,
            content: hasContent ? contentBlocks : undefined,
        });

        const testState = useTestSessionStore.getState();
        const trades = testState.currentSession?.trades || [];
        const newTrade = trades[trades.length - 1];

        if (newTrade && hasContent) {
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

            if (pendingUploads.length > 0) enqueue(pendingUploads);
        }

        setPnl('');
        setRr('');
        setRrValue('');
        setEmotion('');
        setContentBlocks([]);
        if (!mistake || mistake === 'None') setMistake('');
    };

    if (!currentSession) {
        return (
            <Box sx={{ px: 1.75, pb: 1.75 }}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Tạo hoặc chọn phiên test để bắt đầu ghi trade.
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ px: 1.75, pb: 1.75 }}>
            <Stack spacing={1.5}>
                <Grid container spacing={1.25}>
                    <Grid item xs={12} sm={6}>
                        <TradeDatePicker value={tradeDate} onChange={setTradeDate} showAutoSync={false} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Time"
                            type="time"
                            value={tradeTime}
                            onChange={(event) => setTradeTime(event.target.value)}
                            size="small"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <CustomAutocomplete options={markets} value={market} onChange={setMarket} onAdd={addMarket} onRemove={removeMarket} label="Market" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <CustomAutocomplete options={sessionList} value={session} onChange={setSession} onAdd={addSession} onRemove={removeSession} label="Session" />
                    </Grid>
                </Grid>

                <ToggleButtonGroup
                    value={bias}
                    exclusive
                    onChange={(_, newBias) => newBias && setBias(newBias)}
                    fullWidth
                    size="small"
                >
                    <ToggleButton value="long" sx={{ fontWeight: 800, color: 'success.main', '&.Mui-selected': { bgcolor: alpha('#10b981', 0.18), color: '#10b981' } }}>
                        Long
                    </ToggleButton>
                    <ToggleButton value="short" sx={{ fontWeight: 800, color: 'error.main', '&.Mui-selected': { bgcolor: alpha('#f43f5e', 0.18), color: '#f43f5e' } }}>
                        Short
                    </ToggleButton>
                </ToggleButtonGroup>

                <Grid container spacing={1.25}>
                    <Grid item xs={12} sm={4}>
                        <TextField label="PnL ($)" type="number" value={pnl} onChange={(event) => setPnl(event.target.value)} size="small" fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField label="RR" type="number" value={rr} onChange={(event) => setRr(event.target.value)} size="small" fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField label="RR Value" type="number" value={rrValue} onChange={(event) => setRrValue(event.target.value)} size="small" fullWidth />
                    </Grid>
                </Grid>

                <Grid container spacing={1.25}>
                    <Grid item xs={12} sm={4}>
                        <Typography sx={{ mb: 0.75, fontSize: '0.78rem', color: 'text.secondary', fontWeight: 700 }}>
                            Follow đúng plan?
                        </Typography>
                        <ToggleButtonGroup
                            value={followPlan}
                            exclusive
                            onChange={(_, value) => value && setFollowPlan(value)}
                            fullWidth
                            size="small"
                        >
                            <ToggleButton value="yes" sx={{ fontWeight: 800 }}>Yes</ToggleButton>
                            <ToggleButton value="no" sx={{ fontWeight: 800 }}>No</ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <CustomAutocomplete options={mistakes} value={mistake} onChange={setMistake} onAdd={addMistake} onRemove={removeMistake} label="Mistake" />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField label="Emotion" value={emotion} onChange={(event) => setEmotion(event.target.value)} size="small" fullWidth />
                    </Grid>
                </Grid>

                <Box
                    sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: hasContent ? alpha(theme.palette.primary.main, 0.4) : 'divider',
                        bgcolor: hasContent ? alpha(theme.palette.primary.main, 0.06) : alpha(theme.palette.text.primary, 0.025),
                    }}
                >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                        <Box>
                            <Typography sx={{ fontWeight: 800 }}>Nội dung trade</Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                                {hasContent ? `${contentBlocks.length} block đã lưu tạm` : 'Ghi chú, ảnh và review chi tiết ở cùng một nơi'}
                            </Typography>
                        </Box>
                        <Tooltip title={hasContent ? 'Chỉnh sửa nội dung' : 'Thêm nội dung'}>
                            <IconButton
                                onClick={() => setNoteDialogOpen(true)}
                                sx={{
                                    border: '1px solid',
                                    borderColor: hasContent ? alpha(theme.palette.primary.main, 0.45) : 'divider',
                                }}
                            >
                                <Badge variant="dot" invisible={!hasContent} color="primary">
                                    <NoteIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>

                <Stack direction="row" spacing={1.25}>
                    <Button
                        variant="contained"
                        fullWidth
                        color="success"
                        startIcon={<WinIcon />}
                        disabled={!isReady}
                        onClick={() => handleRecordTrade('win')}
                        sx={{ py: 1.35, fontWeight: 900, borderRadius: 2 }}
                    >
                        WIN
                    </Button>
                    <Button
                        variant="contained"
                        fullWidth
                        color="error"
                        startIcon={<LoseIcon />}
                        disabled={!isReady}
                        onClick={() => handleRecordTrade('lose')}
                        sx={{ py: 1.35, fontWeight: 900, borderRadius: 2 }}
                    >
                        LOSE
                    </Button>
                </Stack>

                {!isReady && (
                    <Alert severity="warning" sx={{ borderRadius: 2, py: 0.5 }}>
                        Chọn ít nhất 1 factor để ghi trade.
                    </Alert>
                )}
            </Stack>

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
                        borderRadius: 3,
                        border: '1px solid rgba(241,245,249,0.08)',
                    },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderBottom: '1px solid rgba(241,245,249,0.08)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Nội dung trade</Typography>
                    <IconButton onClick={() => setNoteDialogOpen(false)} sx={{ color: 'rgba(148,163,184,0.8)' }}>
                        <LoseIcon />
                    </IconButton>
                </Box>
                <DialogContent sx={{ bgcolor: '#111827', px: 4, py: 3 }}>
                    <Box sx={{ bgcolor: '#1e2537', borderRadius: 2, p: 2, minHeight: '45vh', border: '1px solid rgba(241,245,249,0.08)' }}>
                        <NotionEditor
                            blocks={contentBlocks}
                            onChange={setContentBlocks}
                            sessionId={currentSession.id}
                            sessionName={`[Test] ${currentSession.name}_${new Date(currentSession.startTime).toLocaleDateString('vi-VN')}`}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ bgcolor: '#111827', borderTop: '1px solid rgba(241,245,249,0.08)', px: 3, py: 2 }}>
                    <Button onClick={() => setContentBlocks([])} sx={{ color: '#f43f5e' }}>Xóa nội dung</Button>
                    <Button onClick={() => setNoteDialogOpen(false)} variant="contained">Lưu & Đóng</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default TradeRecorder;
