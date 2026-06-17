import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import ThemeRegistry from '@/components/ThemeRegistry';

const plusJakarta = Plus_Jakarta_Sans({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-plus-jakarta',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Trade Tracker — Nhật Ký Giao Dịch',
    description: 'Ứng dụng theo dõi, phân tích và tối ưu hóa giao dịch trading với biểu đồ và thống kê chuyên nghiệp.',
    keywords: ['trading', 'trade tracker', 'journal', 'statistics', 'charts', 'forex', 'crypto'],
    authors: [{ name: 'Trade Tracker' }],
    icons: {
        icon: '/favicon.svg',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#f8faff' },
        { media: '(prefers-color-scheme: dark)', color: '#0a0e1a' },
    ],
};

import AuthProvider from '@/components/AuthProvider';
import CloudSyncProvider from '@/components/CloudSyncProvider';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi" className={plusJakarta.variable}>
            <body className={plusJakarta.className}>
                <AuthProvider>
                    <CloudSyncProvider>
                        <ThemeRegistry>{children}</ThemeRegistry>
                    </CloudSyncProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
