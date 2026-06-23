'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PendingUpload {
    id: string;                // Unique ID for this upload task
    idbKey: string;            // Key in IndexedDB where the blob is stored
    idbRef: string;            // "idb://img-xxx" reference used in ContentBlock.value
    sessionId?: string;        // Session ID for Drive folder organization
    sessionName?: string;      // Session name for Drive folder naming
    status: 'pending' | 'uploading' | 'failed';
    retryCount: number;
    createdAt: number;         // Timestamp for cleanup of stale entries
    // Which store and where to update after upload
    storeType: 'live' | 'test';
    tradeId: string;
}

interface UploadQueueState {
    queue: PendingUpload[];

    // Add items to the queue
    enqueue: (items: PendingUpload[]) => void;

    // Update status of an item
    setStatus: (id: string, status: PendingUpload['status']) => void;

    // Remove completed items from the queue
    dequeue: (id: string) => void;

    // Increment retry count
    incrementRetry: (id: string) => void;

    // Get all pending/failed items (for SyncManager to process)
    getPendingItems: () => PendingUpload[];

    // Clean up stale entries (older than 24h)
    cleanupStale: () => void;
}

const MAX_RETRIES = 5;
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

export const useUploadQueueStore = create<UploadQueueState>()(
    persist(
        (set, get) => ({
            queue: [],

            enqueue: (items: PendingUpload[]) => {
                set((state) => ({
                    queue: [...state.queue, ...items],
                }));
            },

            setStatus: (id: string, status: PendingUpload['status']) => {
                set((state) => ({
                    queue: state.queue.map((item) =>
                        item.id === id ? { ...item, status } : item
                    ),
                }));
            },

            dequeue: (id: string) => {
                set((state) => ({
                    queue: state.queue.filter((item) => item.id !== id),
                }));
            },

            incrementRetry: (id: string) => {
                set((state) => ({
                    queue: state.queue.map((item) =>
                        item.id === id
                            ? { ...item, retryCount: item.retryCount + 1, status: 'pending' as const }
                            : item
                    ),
                }));
            },

            getPendingItems: () => {
                return get().queue.filter(
                    (item) =>
                        (item.status === 'pending' || item.status === 'failed') &&
                        item.retryCount < MAX_RETRIES
                );
            },

            cleanupStale: () => {
                const now = Date.now();
                set((state) => ({
                    queue: state.queue.filter(
                        (item) =>
                            now - item.createdAt < STALE_THRESHOLD_MS ||
                            item.status === 'uploading'
                    ),
                }));
            },
        }),
        {
            name: 'upload-queue-storage',
        }
    )
);
