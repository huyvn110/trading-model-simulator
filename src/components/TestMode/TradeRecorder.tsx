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
    DialogTitle,
    DialogContent,
    DialogActions,
    Badge,
} from '@mui/material';
import {
    Check as WinIcon,
    Close as LoseIcon,
    Description as NoteIcon,
} from '@mui/icons-material';
import { useTestSessionStore } from '@/store/testSessionStore';
import { useFactorStore } from '@/store/factorStore';
import { NotionEditor, extractFromContentBlocks } from '@/components/shared/NotionEditor';
import { ContentBlock } from '@/types';

export function TradeRecorder() {
    const { currentSession, addTrade } = useTestSessionStore();
    const { factors } = useFactorStore();
    const selectedFactors = factors.filter((f) => f.selected);

    const [value, setValue] = useState<string>('');
    const [profitRatio, setProfitRatio] = useState<string>('');
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);

    const measurementMode = currentSession?.measurementMode || 'RR';

    const getValueLabel = () => {
        switch (measurementMode) {
            case 'RR':
                return 'Giá trị [RR]';
            case '$':
                return 'Giá trị [$]';
            case '%':
                return 'Giá trị [%]';
        }
    };

    const getProfitLabel = () => {
        switch (measurementMode) {
            case 'RR':
                return 'Tỷ lệ lời (x)';
            case '$':
            case '%':
                return 'Tỷ lệ lời (%)';
        }
    };

    const getProfitPlaceholder = () => {
        switch (measurementMode) {
            case 'RR':
                return 'VD: 1.5 (= 1.5x)';
            case '$':
            case '%':
                return 'VD: 50 (= 50%)';
        }
    };

    const handleRecordTrade = (result: 'win' | 'lose') => {
        if (!currentSession || selectedFactors.length === 0 || !value) return;

        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) return;

        // Calculate actual value with profit ratio for WIN trades
        let finalValue = numValue;
        if (result === 'win' && profitRatio) {
            const ratio = parseFloat(profitRatio);
            if (!isNaN(ratio) && ratio > 0) {
                if (measurementMode === 'RR') {
                    // For RR: multiply (e.g., 1R x 1.5 = 1.5R)
                    finalValue = numValue * ratio;
                } else {
                    // For $ and %: add percentage (e.g., $100 + 50% = $150)
                    finalValue = numValue * (1 + ratio / 100);
                }
            }
        }

        // Extract notes and images from content blocks for backward compatibility
        const { notes, images } = extractFromContentBlocks(contentBlocks);

        addTrade(
            selectedFactors,
            finalValue,
            result,
            notes || undefined,
            images.length > 0 ? images : undefined,
            contentBlocks.length > 0 ? contentBlocks : undefined
        );

        // Reset form
        setValue('');
        setProfitRatio('');
        setContentBlocks([]);
    };

    if (!currentSession) {
        return (
            <Box
                sx={{
                    p: 2.5,
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Ghi Trade
                </Typography>
                <Alert severity="info">
                    Tạo hoặc chọn phiên test để bắt đầu ghi trade
                </Alert>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                p: 2.5,
            }}
        >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Ghi Trade
            </Typography>

            <Stack spacing={2}>
                {/* Selected Factors Display */}
                <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Chọn factor(s) ở trên
                    </Typography>
                    {selectedFactors.length > 0 ? (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {selectedFactors.map((f) => (
                                <Chip
                                    key={f.id}
                                    label={f.name}
                                    size="small"
                                    color="primary"
                                />
                            ))}
                        </Stack>
                    ) : (
                        <Alert severity="warning" sx={{ py: 0.5 }}>
                            Chọn ít nhất 1 factor
                        </Alert>
                    )}
                </Box>

                {/* Value Input */}
                <TextField
                    label={getValueLabel()}
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    size="small"
                    fullWidth
                    placeholder="Nhập giá trị..."
                    inputProps={{ min: 0, step: 0.1 }}
                />

                {/* Profit Ratio Input */}
                <TextField
                    label={getProfitLabel()}
                    type="number"
                    value={profitRatio}
                    onChange={(e) => setProfitRatio(e.target.value)}
                    size="small"
                    fullWidth
                    placeholder={getProfitPlaceholder()}
                    inputProps={{ min: 0, step: 0.1 }}
                    helperText={
                        measurementMode === 'RR'
                            ? 'Nhân với giá trị khi WIN (VD: 1.5x = 1R → 1.5R)'
                            : 'Cộng % vào giá trị khi WIN (VD: 50% = $100 → $150)'
                    }
                />

                {/* Note Icon */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Ghi chú:
                    </Typography>
                    <Tooltip title={contentBlocks.length > 0 ? 'Chỉnh sửa ghi chú' : 'Thêm ghi chú'}>
                        <IconButton
                            onClick={() => setNoteDialogOpen(true)}
                            sx={{
                                color: contentBlocks.length > 0 ? 'primary.main' : 'grey.500',
                                bgcolor: contentBlocks.length > 0 ? 'primary.light' : 'grey.100',
                                '&:hover': {
                                    bgcolor: contentBlocks.length > 0 ? 'primary.main' : 'grey.200',
                                    color: contentBlocks.length > 0 ? 'white' : 'grey.700',
                                },
                            }}
                        >
                            <Badge
                                badgeContent={contentBlocks.length > 0 ? '✓' : null}
                                color="success"
                                sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 14, height: 14 } }}
                            >
                                <NoteIcon />
                            </Badge>
                        </IconButton>
                    </Tooltip>
                    {contentBlocks.length > 0 && (
                        <Typography variant="caption" color="success.main">
                            Đã có ghi chú
                        </Typography>
                    )}
                </Box>

                {/* Note Dialog - Notion Style */}
                <Dialog
                    open={noteDialogOpen}
                    onClose={() => setNoteDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: {
                            bgcolor: '#191919',
                            color: 'white',
                            minHeight: '70vh',
                            maxHeight: '85vh',
                            borderRadius: 2,
                        },
                    }}
                >
                    {/* Notion-style Header */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            px: 3,
                            py: 2,
                            borderBottom: '1px solid #2f2f2f',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <NoteIcon sx={{ color: '#9f9f9f', fontSize: 24 }} />
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 700,
                                    color: 'white',
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                Ghi chú Trade
                            </Typography>
                        </Box>
                        <IconButton
                            onClick={() => setNoteDialogOpen(false)}
                            sx={{
                                color: '#9f9f9f',
                                '&:hover': { bgcolor: '#2f2f2f', color: 'white' },
                            }}
                        >
                            <LoseIcon />
                        </IconButton>
                    </Box>

                    {/* Content Area */}
                    <DialogContent
                        sx={{
                            bgcolor: '#191919',
                            px: 4,
                            py: 3,
                            flex: 1,
                            overflowY: 'auto',
                        }}
                    >
                        <Box
                            sx={{
                                bgcolor: '#1e1e1e',
                                borderRadius: 2,
                                p: 2,
                                minHeight: '45vh',
                                border: '1px solid #2f2f2f',
                            }}
                        >
                            <NotionEditor
                                blocks={contentBlocks}
                                onChange={setContentBlocks}
                                placeholder="Type '/' for commands, or start typing..."
                            />
                        </Box>
                    </DialogContent>

                    {/* Footer Actions */}
                    <DialogActions
                        sx={{
                            bgcolor: '#191919',
                            borderTop: '1px solid #2f2f2f',
                            px: 3,
                            py: 2,
                            gap: 1,
                        }}
                    >
                        <Button
                            onClick={() => setContentBlocks([])}
                            sx={{
                                color: '#ff6b6b',
                                '&:hover': { bgcolor: 'rgba(255, 107, 107, 0.1)' },
                            }}
                        >
                            Xóa ghi chú
                        </Button>
                        <Button
                            onClick={() => setNoteDialogOpen(false)}
                            variant="contained"
                            sx={{
                                bgcolor: '#3b82f6',
                                '&:hover': { bgcolor: '#2563eb' },
                                px: 3,
                            }}
                        >
                            Lưu & Đóng
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Win/Lose Buttons */}
                <Stack direction="row" spacing={1.5}>
                    <Button
                        variant="contained"
                        fullWidth
                        color="success"
                        startIcon={<WinIcon />}
                        onClick={() => handleRecordTrade('win')}
                        disabled={selectedFactors.length === 0 || !value || parseFloat(value) <= 0}
                        sx={{ py: 1.25, fontWeight: 600 }}
                    >
                        WIN
                    </Button>
                    <Button
                        variant="contained"
                        fullWidth
                        color="error"
                        startIcon={<LoseIcon />}
                        onClick={() => handleRecordTrade('lose')}
                        disabled={selectedFactors.length === 0 || !value || parseFloat(value) <= 0}
                        sx={{ py: 1.25, fontWeight: 600 }}
                    >
                        LOSE
                    </Button>
                </Stack>

                {/* Trade count */}
                <Box
                    sx={{
                        textAlign: 'center',
                        py: 1.5,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                    }}
                >
                    <Typography variant="h4" fontWeight={600}>
                        {currentSession.trades.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        trades
                    </Typography>
                </Box>
            </Stack>
        </Box>
    );
}

export default TradeRecorder;
