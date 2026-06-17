'use client';

import React, { useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Switch,
    Stack,
    FormControlLabel,
    Tooltip,
} from '@mui/material';
import {
    CalendarMonth as CalendarIcon,
    Sync as SyncIcon,
} from '@mui/icons-material';

interface TradeDatePickerProps {
    value: string;
    onChange: (date: string) => void;
    autoSync?: boolean;
    onAutoSyncChange?: (enabled: boolean) => void;
    showAutoSync?: boolean;
}

// Format date for display (DD/MM/YYYY)
const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

// Get current date in YYYY-MM-DD format
const getCurrentDate = (): string => {
    return new Date().toISOString().split('T')[0];
};

export function TradeDatePicker({
    value,
    onChange,
    autoSync = true,
    onAutoSyncChange,
    showAutoSync = false,
}: TradeDatePickerProps) {
    // Auto-sync to current date when enabled
    useEffect(() => {
        if (autoSync && showAutoSync) {
            onChange(getCurrentDate());
        }
    }, [autoSync, showAutoSync]);

    return (
        <Box
            sx={{
                p: 2,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
                border: '1px solid',
                borderColor: 'rgba(99, 102, 241, 0.2)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)',
                    opacity: 0.6,
                },
            }}
        >
            <Stack spacing={1.5}>
                {/* Header with icon */}
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                        sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(96, 165, 250, 0.15)',
                            border: '1px solid rgba(96, 165, 250, 0.25)',
                        }}
                    >
                        <CalendarIcon sx={{ fontSize: 16, color: '#60a5fa' }} />
                    </Box>
                    <Typography
                        sx={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            background: 'linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Ngày Giao Dịch
                    </Typography>

                    {/* Auto-sync toggle - only show in Live Trading */}
                    {showAutoSync && onAutoSyncChange && (
                        <Box sx={{ ml: 'auto' }}>
                            <Tooltip title={autoSync ? 'Tự động cập nhật ngày hiện tại' : 'Nhập ngày thủ công'}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            size="small"
                                            checked={autoSync}
                                            onChange={(e) => {
                                                onAutoSyncChange(e.target.checked);
                                                if (e.target.checked) {
                                                    onChange(getCurrentDate());
                                                }
                                            }}
                                            sx={{
                                                '& .MuiSwitch-switchBase.Mui-checked': {
                                                    color: '#60a5fa',
                                                },
                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                    backgroundColor: '#60a5fa',
                                                },
                                            }}
                                        />
                                    }
                                    label={
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <SyncIcon sx={{ fontSize: 14, color: autoSync ? '#60a5fa' : '#64748b' }} />
                                            <Typography
                                                variant="caption"
                                                sx={{ color: autoSync ? '#60a5fa' : '#64748b' }}
                                            >
                                                Tự động
                                            </Typography>
                                        </Stack>
                                    }
                                    labelPlacement="start"
                                    sx={{ m: 0, gap: 0.5 }}
                                />
                            </Tooltip>
                        </Box>
                    )}
                </Stack>

                {/* Date Input */}
                <TextField
                    type="date"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    size="small"
                    fullWidth
                    disabled={showAutoSync && autoSync}
                    InputProps={{
                        sx: {
                            bgcolor: '#1e293b',
                            borderRadius: 1.5,
                            '& input': {
                                color: '#f1f5f9',
                                cursor: showAutoSync && autoSync ? 'not-allowed' : 'pointer',
                            },
                            '& fieldset': {
                                borderColor: 'rgba(99, 102, 241, 0.25)',
                            },
                            '&:hover fieldset': {
                                borderColor: 'rgba(99, 102, 241, 0.4)!important',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#60a5fa!important',
                            },
                            '&.Mui-disabled': {
                                bgcolor: 'rgba(30, 41, 59, 0.5)',
                                '& fieldset': {
                                    borderColor: 'rgba(99, 102, 241, 0.15)',
                                },
                            },
                        },
                    }}
                    inputProps={{
                        max: getCurrentDate(), // Can't select future dates
                    }}
                />

                {/* Display formatted date */}
                {value && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: '#94a3b8',
                            textAlign: 'center',
                            fontStyle: 'italic',
                        }}
                    >
                        📅 {formatDisplayDate(value)}
                        {showAutoSync && autoSync && ' (tự động)'}
                    </Typography>
                )}
            </Stack>
        </Box>
    );
}

export default TradeDatePicker;
