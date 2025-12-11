'use client';

import JSZip from 'jszip';
import { TestSession, TestTrade } from '@/store/testSessionStore';
import { LiveSession, LiveTrade } from '@/types';
import { Factor } from '@/types';

// Helper function to download blob with proper filename
function downloadBlob(blob: Blob, fileName: string) {
    // Create a fresh blob with explicit type to ensure proper MIME type
    const url = URL.createObjectURL(blob);

    // Create invisible anchor
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName; // This sets the filename

    // Append, click, and cleanup
    document.body.appendChild(a);
    a.click();

    // Use requestAnimationFrame for cleanup to ensure download starts
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        });
    });
}

// ==================== BACKUP (EXPORT ZIP) ====================

interface TestSessionBackup {
    version: string;
    type: 'test-session';
    exportDate: string;
    session: TestSession;
    factors: Factor[];
}

interface LiveSessionBackup {
    version: string;
    type: 'live-session';
    exportDate: string;
    session: LiveSession;
}

// Extract images from trades and return mapping
function extractImages(trades: (TestTrade | LiveTrade)[]): Map<string, { tradeId: string; index: number; data: string }> {
    const images = new Map<string, { tradeId: string; index: number; data: string }>();

    trades.forEach(trade => {
        if (trade.images && trade.images.length > 0) {
            trade.images.forEach((img, index) => {
                const fileName = `${trade.id}_${index}.png`;
                images.set(fileName, { tradeId: trade.id, index, data: img });
            });
        }
    });

    return images;
}

// Convert base64 data URL to Blob
function dataURLToBlob(dataURL: string): Blob {
    const parts = dataURL.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(parts[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);

    for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i);
    }

    return new Blob([u8arr], { type: mime });
}

// Backup Test Session to ZIP
export async function backupTestSession(session: TestSession, factors: Factor[]): Promise<void> {
    const zip = new JSZip();

    // Create backup data (without base64 images in JSON)
    const sessionCopy: TestSession = {
        ...session,
        trades: session.trades.map(trade => ({
            ...trade,
            images: trade.images?.map((_, i) => `images/${trade.id}_${i}.png`) || [],
        })),
    };

    const backupData: TestSessionBackup = {
        version: '1.0',
        type: 'test-session',
        exportDate: new Date().toISOString(),
        session: sessionCopy,
        factors: factors,
    };

    // Add data.json
    zip.file('data.json', JSON.stringify(backupData, null, 2));

    // Add images to images/ folder
    const images = extractImages(session.trades);
    const imagesFolder = zip.folder('images');

    images.forEach((imgData, fileName) => {
        const blob = dataURLToBlob(imgData.data);
        imagesFolder?.file(fileName, blob);
    });

    // Generate and download ZIP
    const content = await zip.generateAsync({ type: 'blob' });
    const zipFileName = `backup_${session.name.replace(/[^a-zA-Z0-9\u0080-\uFFFF]/g, '_')}_${new Date().toISOString().split('T')[0]}.zip`;
    downloadBlob(content, zipFileName);
}

// Backup Live Session to ZIP
export async function backupLiveSession(session: LiveSession): Promise<void> {
    const zip = new JSZip();

    const sessionCopy: LiveSession = {
        ...session,
        trades: session.trades.map(trade => ({
            ...trade,
            images: trade.images?.map((_, i) => `images/${trade.id}_${i}.png`) || [],
        })),
    };

    const backupData: LiveSessionBackup = {
        version: '1.0',
        type: 'live-session',
        exportDate: new Date().toISOString(),
        session: sessionCopy,
    };

    zip.file('data.json', JSON.stringify(backupData, null, 2));

    const images = extractImages(session.trades);
    const imagesFolder = zip.folder('images');

    images.forEach((imgData, fileName) => {
        const blob = dataURLToBlob(imgData.data);
        imagesFolder?.file(fileName, blob);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const zipFileName = `backup_live_session_${new Date().toISOString().split('T')[0]}.zip`;
    downloadBlob(content, zipFileName);
}

// ==================== RESTORE (IMPORT ZIP) ====================

// Read file as ArrayBuffer
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// Read file as text
function readFileAsText(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// Convert Blob to base64 data URL
function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Restore Test Session from ZIP
export async function restoreTestSession(file: File): Promise<{ session: TestSession; factors: Factor[] } | null> {
    try {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const zip = await JSZip.loadAsync(arrayBuffer);

        // Read data.json
        const dataFile = zip.file('data.json');
        if (!dataFile) {
            throw new Error('Invalid backup file: data.json not found');
        }

        const dataText = await dataFile.async('text');
        const backupData = JSON.parse(dataText) as TestSessionBackup;

        if (backupData.type !== 'test-session') {
            throw new Error('Invalid backup type: expected test-session');
        }

        // Restore images
        const session = backupData.session;
        for (const trade of session.trades) {
            if (trade.images && trade.images.length > 0) {
                const restoredImages: string[] = [];

                for (const imagePath of trade.images) {
                    const imageFile = zip.file(imagePath);
                    if (imageFile) {
                        const imageBlob = await imageFile.async('blob');
                        const dataURL = await blobToDataURL(imageBlob);
                        restoredImages.push(dataURL);
                    }
                }

                trade.images = restoredImages;
            }
        }

        return { session, factors: backupData.factors };
    } catch (error) {
        console.error('Error restoring test session:', error);
        return null;
    }
}

// Restore Live Session from ZIP
export async function restoreLiveSession(file: File): Promise<LiveSession | null> {
    try {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const zip = await JSZip.loadAsync(arrayBuffer);

        const dataFile = zip.file('data.json');
        if (!dataFile) {
            throw new Error('Invalid backup file: data.json not found');
        }

        const dataText = await dataFile.async('text');
        const backupData = JSON.parse(dataText) as LiveSessionBackup;

        if (backupData.type !== 'live-session') {
            throw new Error('Invalid backup type: expected live-session');
        }

        const session = backupData.session;
        for (const trade of session.trades) {
            if (trade.images && trade.images.length > 0) {
                const restoredImages: string[] = [];

                for (const imagePath of trade.images) {
                    const imageFile = zip.file(imagePath);
                    if (imageFile) {
                        const imageBlob = await imageFile.async('blob');
                        const dataURL = await blobToDataURL(imageBlob);
                        restoredImages.push(dataURL);
                    }
                }

                trade.images = restoredImages;
            }
        }

        return session;
    } catch (error) {
        console.error('Error restoring live session:', error);
        return null;
    }
}
