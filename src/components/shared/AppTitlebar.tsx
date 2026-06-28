'use client';

import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import {
    Remove as MinimizeIcon,
    CropSquare as MaximizeIcon,
    FilterNone as RestoreIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

// Khai báo kiểu cho window.electronAPI
declare global {
    interface Window {
        electronAPI?: {
            minimize: () => void;
            maximize: () => void;
            close: () => void;
            isMaximized: () => Promise<boolean>;
            onMaximizeChange: (callback: (isMax: boolean) => void) => void;
            isElectron: boolean;
        };
    }
}

export default function AppTitlebar() {
    const [isElectron, setIsElectron] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        // Kiểm tra xem có đang chạy trong Electron không
        if (window.electronAPI?.isElectron) {
            setIsElectron(true);

            // Lấy trạng thái maximize ban đầu
            window.electronAPI.isMaximized().then(setIsMaximized);

            // Lắng nghe thay đổi maximize
            window.electronAPI.onMaximizeChange((isMax) => {
                setIsMaximized(isMax);
            });
        }
    }, []);

    // Không hiện gì nếu đang chạy trên web
    if (!isElectron) return null;

    const handleMinimize = () => window.electronAPI?.minimize();
    const handleMaximize = () => window.electronAPI?.maximize();
    const handleClose = () => window.electronAPI?.close();

    return (
        <Box
            sx={{
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: '#0c0e14',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                // Cho phép kéo thả cửa sổ bằng vùng này
                WebkitAppRegion: 'drag',
                userSelect: 'none',
            }}
        >
            {/* Logo + Tên App bên trái */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1.5 }}>
                <Box
                    component="img"
                    src="/brand-mark.svg"
                    alt="Trade Tracker"
                    sx={{
                        width: 18,
                        height: 18,
                        borderRadius: '4px',
                        objectFit: 'contain',
                    }}
                />
                <Typography
                    variant="body2"
                    sx={{
                        color: '#94a3b8',
                        fontSize: '12px',
                        fontWeight: 600,
                        letterSpacing: '0.3px',
                    }}
                >
                    Trade Tracker
                </Typography>
            </Box>

            {/* 3 nút điều khiển bên phải */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    // Không cho kéo thả ở vùng nút bấm
                    WebkitAppRegion: 'no-drag',
                }}
            >
                {/* Nút Thu nhỏ */}
                <IconButton
                    onClick={handleMinimize}
                    size="small"
                    sx={{
                        borderRadius: 0,
                        width: 46,
                        height: '100%',
                        color: '#64748b',
                        '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.08)',
                            color: '#e2e8f0',
                        },
                    }}
                >
                    <MinimizeIcon sx={{ fontSize: 16 }} />
                </IconButton>

                {/* Nút Phóng to / Thu nhỏ */}
                <IconButton
                    onClick={handleMaximize}
                    size="small"
                    sx={{
                        borderRadius: 0,
                        width: 46,
                        height: '100%',
                        color: '#64748b',
                        '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.08)',
                            color: '#e2e8f0',
                        },
                    }}
                >
                    {isMaximized ? (
                        <RestoreIcon sx={{ fontSize: 14 }} />
                    ) : (
                        <MaximizeIcon sx={{ fontSize: 14 }} />
                    )}
                </IconButton>

                {/* Nút Đóng - đỏ khi hover */}
                <IconButton
                    onClick={handleClose}
                    size="small"
                    sx={{
                        borderRadius: 0,
                        width: 46,
                        height: '100%',
                        color: '#64748b',
                        '&:hover': {
                            bgcolor: '#dc2626',
                            color: '#ffffff',
                        },
                    }}
                >
                    <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>
        </Box>
    );
}
