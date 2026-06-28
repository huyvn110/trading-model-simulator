import type { Metadata, Viewport } from 'next';
import './globals.css';
import ThemeRegistry from '@/components/ThemeRegistry';
import AuthProvider from '@/components/AuthProvider';
import CloudSyncProvider from '@/components/CloudSyncProvider';
import ElectronShell from '@/components/ElectronShell';

export const metadata: Metadata = {
    title: 'Trade Tracker - Nhật Ký Giao Dịch',
    description: 'Ứng dụng theo dõi, phân tích và tối ưu hóa giao dịch trading với biểu đồ và thống kê chuyên nghiệp.',
    keywords: ['trading', 'trade tracker', 'journal', 'statistics', 'charts', 'forex', 'crypto'],
    authors: [{ name: 'Trade Tracker' }],
    icons: {
        icon: '/favicon.svg',
        shortcut: '/favicon.svg',
        apple: '/app-icon.png',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#f8faff' },
        { media: '(prefers-color-scheme: dark)', color: '#191919' },
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi">
            <body>
                <AuthProvider>
                    <CloudSyncProvider>
                        <ThemeRegistry>
                            <ElectronShell>
                                {children}
                            </ElectronShell>
                        </ThemeRegistry>
                    </CloudSyncProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
