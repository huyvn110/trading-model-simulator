import type { Metadata } from 'next';
import './globals.css';
import ThemeRegistry from '@/components/ThemeRegistry';

export const metadata: Metadata = {
    title: 'Trading Model Simulator - Notion-like Interface',
    description: 'A Notion-like application for simulating and analyzing trading models with beautiful charts and statistics.',
    keywords: ['trading', 'simulator', 'model', 'statistics', 'charts'],
    authors: [{ name: 'Trading Simulator' }],
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
