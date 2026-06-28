'use client';

import React, { useState, useEffect } from 'react';
import AppTitlebar from '@/components/shared/AppTitlebar';
import { Box } from '@mui/material';

export default function ElectronShell({ children }: { children: React.ReactNode }) {
    const [isElectron, setIsElectron] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).electronAPI?.isElectron) {
            setIsElectron(true);
        }
    }, []);

    return (
        <>
            <AppTitlebar />
            {/* Thêm padding-top 36px cho nội dung khi chạy Electron để không bị che */}
            <Box sx={{ pt: isElectron ? '36px' : 0 }}>
                {children}
            </Box>
        </>
    );
}
