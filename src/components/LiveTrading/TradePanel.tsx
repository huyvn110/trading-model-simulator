'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Chip,
    Alert,
    IconButton,
} from '@mui/material';
import {
    Check as WinIcon,
    Close as LoseIcon,
    Image as ImageIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useModelStore } from '@/store/modelStore';
import { useLiveSessionStore } from '@/store/liveSessionStore';
import { MeasurementMode } from '@/types';

export function TradePanel() {
    const { getSelectedModel, areAllFactorsChecked, resetChecklist } = useModelStore();
    const {
        measurementMode,
        setMeasurementMode,
        currentSession,
        addTrade,
    } = useLiveSessionStore();

    const [value, setValue] = useState<string>('');
    const [profitRatio, setProfitRatio] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [images, setImages] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const selectedModel = getSelectedModel();
    const isSessionActive = !!currentSession;
    const allFactorsChecked = selectedModel ? areAllFactorsChecked(selectedModel.id) : false;

    const handleAddTrade = (result: 'win' | 'lose') => {
        if (!selectedModel || !value) return;

        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) return;

        const numProfitRatio = profitRatio ? parseFloat(profitRatio) : undefined;

        addTrade(
            selectedModel.id,
            selectedModel.name,
            numValue,
            numProfitRatio,
            result,
            notes.trim() || undefined,
            images.length > 0 ? images : undefined
        );

        // Reset checklist and form after trade
        resetChecklist(selectedModel.id);
        setValue('');
        setProfitRatio('');
        setNotes('');
        setImages([]);
    };

    const getModeLabel = (mode: MeasurementMode) => {
        switch (mode) {
            case 'RR':
                return 'RR';
            case '$':
                return '$';
            case '%':
                return '%';
        }
    };

    const getValueLabel = () => {
        switch (measurementMode) {
            case 'RR':
                return 'R:R Value';
            case '$':
                return 'Dollar Amount';
            case '%':
                return 'Percentage';
        }
    };

    const getValueSuffix = () => {
        switch (measurementMode) {
            case 'RR':
                return 'R';
            case '$':
                return '$';
            case '%':
                return '%';
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

    const handlePaste = useCallback((e: ClipboardEvent) => {
        console.log('Paste event detected in Live Trade Panel', e);
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
        return () => document.removeEventListener('paste', handlePaste);
    }, [handlePaste]);

    return (
        <Box
            sx={{
                p: 2.5,
            }}
        >
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Add Trade
            </Typography>

            <Stack spacing={2.5}>
                {/* Measurement Mode */}
                <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Measurement Mode {isSessionActive && '(locked)'}
                    </Typography>
                    <ToggleButtonGroup
                        value={measurementMode}
                        exclusive
                        onChange={(_, newMode) => newMode && setMeasurementMode(newMode)}
                        disabled={isSessionActive}
                        fullWidth
                        size="small"
                    >
                        <ToggleButton value="RR" sx={{ fontWeight: 600 }}>
                            RR
                        </ToggleButton>
                        <ToggleButton value="$" sx={{ fontWeight: 600 }}>
                            $
                        </ToggleButton>
                        <ToggleButton value="%" sx={{ fontWeight: 600 }}>
                            %
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* Selected Model */}
                <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Selected Model
                    </Typography>
                    {selectedModel ? (
                        <Chip
                            label={selectedModel.name}
                            color="primary"
                            sx={{ fontWeight: 500 }}
                        />
                    ) : (
                        <Alert severity="info" sx={{ py: 0.5 }}>
                            Select a model from the list
                        </Alert>
                    )}
                </Box>

                {/* Value Input */}
                <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {getValueLabel()}
                    </Typography>
                    <TextField
                        type="number"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        size="small"
                        fullWidth
                        placeholder={`Enter ${getValueLabel().toLowerCase()}`}
                        InputProps={{
                            endAdornment: (
                                <Typography color="text.secondary" sx={{ ml: 1 }}>
                                    {getValueSuffix()}
                                </Typography>
                            ),
                        }}
                        inputProps={{ min: 0, step: 0.1 }}
                    />
                </Box>

                {/* Profit Ratio */}
                <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {getProfitLabel()}
                    </Typography>
                    <TextField
                        type="number"
                        value={profitRatio}
                        onChange={(e) => setProfitRatio(e.target.value)}
                        size="small"
                        fullWidth
                        placeholder={getProfitPlaceholder()}
                        helperText={
                            measurementMode === 'RR'
                                ? 'Nhân với giá trị ở trên khi thắng (VD: 1.5x)'
                                : 'Phần trăm lợi nhuận (VD: 50 = +50%)'
                        }
                        inputProps={{ min: 0, step: 0.1 }}
                    />
                </Box>

                {/* Notes Input */}
                <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Ghi chú (tùy chọn)
                    </Typography>
                    <TextField
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        multiline
                        rows={2}
                        size="small"
                        fullWidth
                        placeholder="Thêm ghi chú cho lệnh này..."
                    />
                </Box>

                {/* Image Upload */}
                <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Hình ảnh (tùy chọn)
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {images.map((img, index) => (
                            <Box
                                key={index}
                                sx={{
                                    position: 'relative',
                                    width: 80,
                                    height: 80,
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <img
                                    src={img}
                                    alt={`Image ${index + 1}`}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                    }}
                                />
                                <IconButton
                                    size="small"
                                    onClick={() => setImages(images.filter((_, i) => i !== index))}
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
                            sx={{ width: 80, height: 80, fontSize: '0.75rem' }}
                        >
                            <Stack alignItems="center" spacing={0.5}>
                                <ImageIcon />
                                <Typography variant="caption">Add</Typography>
                            </Stack>
                        </Button>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleImageUpload}
                        />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Hoặc paste (Ctrl+V) để thêm ảnh từ clipboard
                    </Typography>
                </Box>

                {/* Checklist Warning */}
                {selectedModel && selectedModel.factors.length > 0 && !allFactorsChecked && (
                    <Alert severity="warning" sx={{ py: 0.5 }}>
                        Vui lòng check hết factors trước khi trade
                    </Alert>
                )}

                {/* Win/Lose Buttons */}
                <Stack direction="row" spacing={1.5}>
                    <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        size="large"
                        startIcon={<WinIcon />}
                        onClick={() => handleAddTrade('win')}
                        disabled={!selectedModel || !value || parseFloat(value) <= 0 || !allFactorsChecked}
                        sx={{
                            py: 1.5,
                            fontWeight: 600,
                            fontSize: '1rem',
                        }}
                    >
                        WIN
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        fullWidth
                        size="large"
                        startIcon={<LoseIcon />}
                        onClick={() => handleAddTrade('lose')}
                        disabled={!selectedModel || !value || parseFloat(value) <= 0 || !allFactorsChecked}
                        sx={{
                            py: 1.5,
                            fontWeight: 600,
                            fontSize: '1rem',
                        }}
                    >
                        LOSE
                    </Button>
                </Stack>

                {/* Session status */}
                {isSessionActive && (
                    <Chip
                        label={`Session active: ${currentSession?.trades.length || 0} trades`}
                        color="success"
                        variant="outlined"
                        size="small"
                    />
                )}
            </Stack>
        </Box>
    );
}

export default TradePanel;
