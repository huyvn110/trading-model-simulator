'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Stack,
    Alert,
    Chip,
    IconButton,
    Dialog,
} from '@mui/material';
import {
    Check as WinIcon,
    Close as LoseIcon,
    Image as ImageIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTestSessionStore } from '@/store/testSessionStore';
import { useFactorStore } from '@/store/factorStore';

export function TradeRecorder() {
    const { currentSession, addTrade } = useTestSessionStore();
    const { factors } = useFactorStore();
    const selectedFactors = factors.filter((f) => f.selected);

    const [value, setValue] = useState<string>('');
    const [profitRatio, setProfitRatio] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [images, setImages] = useState<string[]>([]);
    const [zoomImage, setZoomImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setImages([...images, base64]);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // Handle Ctrl+V paste for images
    const handlePaste = useCallback((e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (!file) continue;

                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64 = event.target?.result as string;
                    setImages((prev) => [...prev, base64]);
                };
                reader.readAsDataURL(file);
                break;
            }
        }
    }, []);

    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [handlePaste]);

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

        addTrade(
            selectedFactors,
            finalValue,
            result,
            notes || undefined,
            images.length > 0 ? images : undefined
        );

        // Reset form
        setValue('');
        setProfitRatio('');
        setNotes('');
        setImages([]);
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
        <>
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

                    {/* Notes */}
                    <TextField
                        label="Ghi chú (tùy chọn)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        size="small"
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Nhập ghi chú..."
                    />

                    {/* Image Upload */}
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Ảnh (Ctrl+V hoặc click)
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                            {/* Image Thumbnails */}
                            {images.map((img, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        position: 'relative',
                                        width: 50,
                                        height: 50,
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                        border: '2px solid',
                                        borderColor: 'primary.main',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            opacity: 0.8,
                                        },
                                    }}
                                    onClick={() => setZoomImage(img)}
                                >
                                    <img
                                        src={img}
                                        alt={`Upload ${index + 1}`}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setImages(images.filter((_, i) => i !== index));
                                        }}
                                        sx={{
                                            position: 'absolute',
                                            top: -4,
                                            right: -4,
                                            bgcolor: 'error.main',
                                            color: 'white',
                                            padding: '2px',
                                            '&:hover': { bgcolor: 'error.dark' },
                                        }}
                                    >
                                        <DeleteIcon sx={{ fontSize: 12 }} />
                                    </IconButton>
                                </Box>
                            ))}
                            {/* Add Image Button */}
                            <Box
                                sx={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 1,
                                    border: '2px dashed',
                                    borderColor: 'grey.400',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        bgcolor: 'primary.50',
                                    },
                                }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <ImageIcon sx={{ color: 'grey.500' }} />
                            </Box>
                        </Stack>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleImageUpload}
                        />
                    </Box>

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

            {/* Zoom Dialog */}
            <Dialog
                open={!!zoomImage}
                onClose={() => setZoomImage(null)}
                maxWidth="lg"
            >
                {zoomImage && (
                    <Box
                        sx={{
                            p: 1,
                            bgcolor: 'black',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                        onClick={() => setZoomImage(null)}
                    >
                        <img
                            src={zoomImage}
                            alt="Zoom"
                            style={{
                                maxWidth: '90vw',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                            }}
                        />
                    </Box>
                )}
            </Dialog>
        </>
    );
}

export default TradeRecorder;
