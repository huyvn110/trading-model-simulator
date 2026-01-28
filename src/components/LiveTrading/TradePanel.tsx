'use client';

import React, { useState } from 'react';
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
import { useModelStore } from '@/store/modelStore';
import { useLiveSessionStore } from '@/store/liveSessionStore';
import { MeasurementMode, ContentBlock } from '@/types';
import { NotionEditor, extractFromContentBlocks } from '@/components/shared/NotionEditor';

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
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);

    const selectedModel = getSelectedModel();
    const isSessionActive = !!currentSession;
    const allFactorsChecked = selectedModel ? areAllFactorsChecked(selectedModel.id) : false;

    const handleAddTrade = (result: 'win' | 'lose') => {
        if (!selectedModel || !value) return;

        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) return;

        const numProfitRatio = profitRatio ? parseFloat(profitRatio) : undefined;

        // Extract notes and images from content blocks for backward compatibility
        const { notes, images } = extractFromContentBlocks(contentBlocks);

        addTrade(
            selectedModel.id,
            selectedModel.name,
            numValue,
            numProfitRatio,
            result,
            notes.trim() || undefined,
            images.length > 0 ? images : undefined,
            contentBlocks.length > 0 ? contentBlocks : undefined
        );

        // Reset checklist and form after trade
        resetChecklist(selectedModel.id);
        setValue('');
        setProfitRatio('');
        setContentBlocks([]);
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
