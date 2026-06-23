'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useUploadQueueStore, PendingUpload } from '@/store/uploadQueueStore';
import { useLiveSessionStore } from '@/store/liveSessionStore';
import { useTestSessionStore } from '@/store/testSessionStore';
import { getImageBlob, deleteImageBlob, isIdbImageRef } from '@/lib/imageStore';

/**
 * SyncManager - Background component that processes the upload queue.
 * 
 * It runs invisibly in the root layout and:
 * 1. On mount, checks for any pending uploads (handles browser restart scenario)
 * 2. Watches the upload queue for new items
 * 3. Uploads images to Google Drive one by one
 * 4. Updates the trade's ContentBlock value from "idb://xxx" to the real Drive URL
 * 5. Cleans up IndexedDB blobs after successful upload
 */
export function SyncManager() {
    const isProcessingRef = useRef(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const { queue, getPendingItems, setStatus, dequeue, incrementRetry, cleanupStale } =
        useUploadQueueStore();

    const processQueue = useCallback(async () => {
        if (isProcessingRef.current) return;

        const pendingItems = getPendingItems();
        if (pendingItems.length === 0) return;

        isProcessingRef.current = true;

        for (const item of pendingItems) {
            try {
                await processUpload(item);
            } catch (error) {
                console.error(`[SyncManager] Failed to process upload ${item.id}:`, error);
            }
        }

        isProcessingRef.current = false;
    }, [getPendingItems]);

    const processUpload = async (item: PendingUpload) => {
        // Mark as uploading
        setStatus(item.id, 'uploading');

        try {
            // 1. Get the blob from IndexedDB
            const blob = await getImageBlob(item.idbKey);
            if (!blob) {
                console.warn(`[SyncManager] Blob not found for key ${item.idbKey}, removing from queue`);
                dequeue(item.id);
                return;
            }

            // 2. Upload to Google Drive
            const { uploadImageToDrive } = await import('@/lib/uploadImage');
            const file = new File([blob], `trade-image-${item.id}.webp`, { type: blob.type || 'image/webp' });
            const driveUrl = await uploadImageToDrive(file, item.sessionId, item.sessionName);

            // 3. Update the trade in the appropriate store
            updateTradeImageUrl(item, driveUrl);

            // 4. Clean up: remove blob from IndexedDB and item from queue
            await deleteImageBlob(item.idbKey);
            dequeue(item.id);

            console.log(`[SyncManager] Successfully uploaded ${item.id} -> ${driveUrl}`);
        } catch (error) {
            console.error(`[SyncManager] Upload failed for ${item.id}:`, error);
            
            if (item.retryCount >= 4) {
                // Max retries reached, mark as permanently failed
                setStatus(item.id, 'failed');
            } else {
                // Increment retry and mark as pending for next cycle
                incrementRetry(item.id);
            }
        }
    };

    const updateTradeImageUrl = (item: PendingUpload, newUrl: string) => {
        const idbRef = item.idbRef;

        if (item.storeType === 'live') {
            // Update in liveSessionStore
            const liveState = useLiveSessionStore.getState();
            
            // Check currentSession
            if (liveState.currentSession) {
                const updatedTrades = liveState.currentSession.trades.map((trade) => {
                    if (trade.id !== item.tradeId) return trade;
                    return {
                        ...trade,
                        content: trade.content?.map((block) =>
                            block.type === 'image' && block.value === idbRef
                                ? { ...block, value: newUrl }
                                : block
                        ),
                        images: trade.images?.map((img) =>
                            img === idbRef ? newUrl : img
                        ),
                    };
                });

                useLiveSessionStore.setState({
                    currentSession: {
                        ...liveState.currentSession,
                        trades: updatedTrades,
                    },
                });
            }

            // Check sessionHistory
            const updatedHistory = liveState.sessionHistory.map((session) => ({
                ...session,
                trades: session.trades.map((trade) => {
                    if (trade.id !== item.tradeId) return trade;
                    return {
                        ...trade,
                        content: trade.content?.map((block) =>
                            block.type === 'image' && block.value === idbRef
                                ? { ...block, value: newUrl }
                                : block
                        ),
                        images: trade.images?.map((img) =>
                            img === idbRef ? newUrl : img
                        ),
                    };
                }),
            }));

            useLiveSessionStore.setState({
                sessionHistory: updatedHistory,
            });
        } else if (item.storeType === 'test') {
            // Update in testSessionStore
            const testState = useTestSessionStore.getState();

            if (testState.currentSession) {
                const updatedTrades = testState.currentSession.trades.map((trade) => {
                    if (trade.id !== item.tradeId) return trade;
                    return {
                        ...trade,
                        content: trade.content?.map((block) =>
                            block.type === 'image' && block.value === idbRef
                                ? { ...block, value: newUrl }
                                : block
                        ),
                        images: trade.images?.map((img) =>
                            img === idbRef ? newUrl : img
                        ),
                    };
                });

                const updatedSession = {
                    ...testState.currentSession,
                    trades: updatedTrades,
                };

                useTestSessionStore.setState({
                    currentSession: updatedSession,
                    sessions: testState.sessions.map((s) =>
                        s.id === updatedSession.id ? updatedSession : s
                    ),
                });
            }

            // Also check all sessions in history
            const updatedSessions = testState.sessions.map((session) => ({
                ...session,
                trades: session.trades.map((trade) => {
                    if (trade.id !== item.tradeId) return trade;
                    return {
                        ...trade,
                        content: trade.content?.map((block) =>
                            block.type === 'image' && block.value === idbRef
                                ? { ...block, value: newUrl }
                                : block
                        ),
                        images: trade.images?.map((img) =>
                            img === idbRef ? newUrl : img
                        ),
                    };
                }),
            }));

            useTestSessionStore.setState({
                sessions: updatedSessions,
            });
        }
    };

    // Process queue on mount and whenever queue changes
    useEffect(() => {
        // Clean up stale entries on mount
        cleanupStale();

        // Process immediately
        processQueue();

        // Set up periodic check every 5 seconds
        intervalRef.current = setInterval(() => {
            processQueue();
        }, 5000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Re-process when queue changes (new items added)
    useEffect(() => {
        // Small delay to batch multiple enqueue calls
        const timer = setTimeout(() => {
            processQueue();
        }, 500);

        return () => clearTimeout(timer);
    }, [queue.length]);

    // Warn user before closing if there are pending uploads
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const pending = getPendingItems();
            if (pending.length > 0) {
                e.preventDefault();
                e.returnValue = 'Đang đồng bộ ảnh lên hệ thống. Bạn có chắc muốn rời trang?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [getPendingItems]);

    // This component renders nothing - it's purely a background worker
    return null;
}

export default SyncManager;
