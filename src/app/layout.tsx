import type { Metadata } from 'next';
import './globals.css';
import ThemeRegistry from '@/components/ThemeRegistry';

export const metadata: Metadata = {
    title: 'Trade Tracker - Theo dõi giao dịch',
    description: 'Ứng dụng theo dõi và phân tích giao dịch trading với biểu đồ và thống kê chuyên nghiệp.',
    keywords: ['trading', 'trade tracker', 'journal', 'statistics', 'charts'],
    authors: [{ name: 'Trade Tracker' }],
    icons: {
        icon: '/favicon.svg',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <ThemeRegistry>{children}</ThemeRegistry>
            </body>
        </html>
    );
}
