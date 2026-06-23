'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
    MeasurementMode,
    LiveTrade,
    LiveSession,
    LiveModelStats,
    ContentBlock,
} from '@/types';
import { isIdbImageRef, extractIdbKey, deleteImageBlob } from '@/lib/imageStore';

interface LiveSessionState {
    // Settings
    measurementMode: MeasurementMode;
    setMeasurementMode: (mode: MeasurementMode) => void;

    // Current session
    currentSession: LiveSession | null;
    startSession: (initialBalance: number) => void;
    endSession: () => void;

    // Trade management
    addTrade: (tradeData: Omit<LiveTrade, 'id' | 'timestamp'>) => void;
    updateTradeNotes: (tradeId: string, notes: string) => void;
    updateTradeContent: (tradeId: string, content: ContentBlock[]) => void;
    addTradeImage: (tradeId: string, image: string) => void;
    removeTradeImage: (tradeId: string, imageIndex: number) => void;
    deleteTrade: (tradeId: string) => void;

    // History
    sessionHistory: LiveSession[];
    clearHistory: () => void;
    deleteSessionFromHistory: (sessionId: string) => void;

    // Stats
    getModelStats: (modelId?: string) => LiveModelStats[];
    getCurrentSessionStats: () => LiveModelStats[];
}

const calculateModelStats = (trades: LiveTrade[]): LiveModelStats[] => {
    const statsMap: Record<string, LiveModelStats> = {};

    trades.forEach((trade) => {
        if (!statsMap[trade.modelId]) {
            statsMap[trade.modelId] = {
                modelId: trade.modelId,
                modelName: trade.modelName,
                totalTrades: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                totalProfit: 0,
                totalLoss: 0,
            };
        }

        const stats = statsMap[trade.modelId];
        stats.totalTrades++;

        if (trade.result === 'win') {
            stats.wins++;
            stats.totalProfit += trade.measurementValue;
        } else {
            stats.losses++;
            stats.totalLoss += trade.measurementValue;
        }

        stats.winRate = stats.totalTrades > 0
            ? (stats.wins / stats.totalTrades) * 100
            : 0;
    });

    return Object.values(statsMap).sort((a, b) => b.winRate - a.winRate);
};

export const useLiveSessionStore = create<LiveSessionState>()(
    persist(
        (set, get) => ({
            measurementMode: 'RR',
            currentSession: null,
            sessionHistory: [],

            setMeasurementMode: (mode: MeasurementMode) => {
                // Only allow changing if no active session
                if (!get().currentSession) {
                    set({ measurementMode: mode });
                }
            },

            startSession: (initialBalance: number) => {
                const session: LiveSession = {
                    id: uuidv4(),
                    startTime: Date.now(),
                    initialBalance,
                    measurementMode: get().measurementMode,
                    trades: [],
                };
                set({ currentSession: session });
            },

            endSession: () => {
                const { currentSession } = get();
                if (currentSession && currentSession.trades.length > 0) {
                    const endedSession = {
                        ...currentSession,
                        endTime: Date.now(),
                    };
                    set((state) => ({
                        currentSession: null,
                        sessionHistory: [endedSession, ...state.sessionHistory].slice(0, 100),
                    }));
                } else {
                    set({ currentSession: null });
                }
            },

            addTrade: (tradeData: Omit<LiveTrade, 'id' | 'timestamp'>) => {
                const { currentSession, measurementMode } = get();

                // Calculate final legacy measurementValue if needed
                let finalValue = tradeData.measurementValue || 0;
                if (tradeData.result === 'win' && tradeData.profitRatio && tradeData.profitRatio > 0) {
                    if (measurementMode === 'RR') {
                        finalValue = finalValue * tradeData.profitRatio;
                    } else {
                        finalValue = finalValue * (1 + tradeData.profitRatio / 100);
                    }
                }

                // Default to current date if not provided
                const dateStr = tradeData.tradeDate || new Date().toISOString().split('T')[0];

                const trade: LiveTrade = {
                    ...tradeData,
                    id: uuidv4(),
                    timestamp: Date.now(),
                    tradeDate: dateStr,
                    measurementValue: finalValue, // Still computing legacy for fallback if needed
                };

                set((state) => {
                    if (!state.currentSession) {
                        // Auto-start session if not started (with default balance 0)
                        const session: LiveSession = {
                            id: uuidv4(),
                            startTime: Date.now(),
                            initialBalance: 0,  // Default, user should start session explicitly
                            measurementMode: state.measurementMode,
                            trades: [trade],
                        };
                        return { currentSession: session };
                    }

                    return {
                        currentSession: {
                            ...state.currentSession,
                            trades: [...state.currentSession.trades, trade],
                        },
                    };
                });
            },

            updateTradeNotes: (tradeId: string, notes: string) => {
                set((state) => {
                    if (!state.currentSession) return state;

                    return {
                        currentSession: {
                            ...state.currentSession,
                            trades: state.currentSession.trades.map((t) =>
                                t.id === tradeId ? { ...t, notes } : t
                            ),
                        },
                    };
                });
            },

            updateTradeContent: (tradeId: string, content: ContentBlock[]) => {
                set((state) => {
                    if (!state.currentSession) return state;

                    return {
                        currentSession: {
                            ...state.currentSession,
                            trades: state.currentSession.trades.map((t) =>
                                t.id === tradeId ? { ...t, content } : t
                            ),
                        },
                    };
                });
            },


            addTradeImage: (tradeId: string, image: string) => {
                set((state) => {
                    if (!state.currentSession) return state;

                    return {
                        currentSession: {
                            ...state.currentSession,
                            trades: state.currentSession.trades.map((t) =>
                                t.id === tradeId
                                    ? { ...t, images: [...(t.images || []), image] }
                                    : t
                            ),
                        },
                    };
                });
            },

            removeTradeImage: (tradeId: string, imageIndex: number) => {
                set((state) => {
                    if (!state.currentSession) return state;

                    return {
                        currentSession: {
                            ...state.currentSession,
                            trades: state.currentSession.trades.map((t) =>
                                t.id === tradeId
                                    ? {
                                        ...t,
                                        images: t.images?.filter((_, i) => i !== imageIndex),
                                    }
                                    : t
                            ),
                        },
                    };
                });
            },

            deleteTrade: (tradeId: string) => {
                const { currentSession } = get();
                if (!currentSession) return;

                // Tìm trade để xóa ảnh Drive hoặc IDB
                const trade = currentSession.trades.find((t) => t.id === tradeId);
                if (trade) {
                    // Clean up images
                    trade.content?.forEach((block) => {
                        if (block.type === 'image') {
                            if (isIdbImageRef(block.value)) {
                                deleteImageBlob(extractIdbKey(block.value));
                            } else if (block.value.includes('drive.google.com')) {
                                import('@/lib/uploadImage').then(({ deleteImageFromDrive }) => {
                                    deleteImageFromDrive(block.value);
                                });
                            }
                        }
                    });
                    trade.images?.forEach((imgUrl) => {
                        if (isIdbImageRef(imgUrl)) {
                            deleteImageBlob(extractIdbKey(imgUrl));
                        } else if (imgUrl.includes('drive.google.com')) {
                            import('@/lib/uploadImage').then(({ deleteImageFromDrive }) => {
                                deleteImageFromDrive(imgUrl);
                            });
                        }
                    });
                }

                set((state) => {
                    if (!state.currentSession) return state;

                    return {
                        currentSession: {
                            ...state.currentSession,
                            trades: state.currentSession.trades.filter((t) => t.id !== tradeId),
                        },
                    };
                });
            },

            clearHistory: () => {
                set({ sessionHistory: [] });
            },

            deleteSessionFromHistory: (sessionId: string) => {
                const { sessionHistory } = get();
                const sessionToDelete = sessionHistory.find((s) => s.id === sessionId);

                // Xóa từng ảnh của tất cả các trade trong phiên
                if (sessionToDelete) {
                    sessionToDelete.trades.forEach((trade) => {
                        trade.content?.forEach((block) => {
                            if (block.type === 'image') {
                                if (isIdbImageRef(block.value)) {
                                    deleteImageBlob(extractIdbKey(block.value));
                                } else if (block.value.includes('drive.google.com')) {
                                    import('@/lib/uploadImage').then(({ deleteImageFromDrive }) => {
                                        deleteImageFromDrive(block.value);
                                    });
                                }
                            }
                        });
                        trade.images?.forEach((imgUrl) => {
                            if (isIdbImageRef(imgUrl)) {
                                deleteImageBlob(extractIdbKey(imgUrl));
                            } else if (imgUrl.includes('drive.google.com')) {
                                import('@/lib/uploadImage').then(({ deleteImageFromDrive }) => {
                                    deleteImageFromDrive(imgUrl);
                                });
                            }
                        });
                    });
                }

                // Xóa folder phiên trên Drive
                import('@/lib/uploadImage').then(({ deleteSessionImages }) => {
                    deleteSessionImages(sessionId);
                });

                set((state) => ({
                    sessionHistory: state.sessionHistory.filter((s) => s.id !== sessionId),
                }));
            },

            getModelStats: (modelId?: string) => {
                const { sessionHistory, currentSession } = get();
                const allTrades = [
                    ...(currentSession?.trades || []),
                    ...sessionHistory.flatMap((s) => s.trades),
                ];

                const stats = calculateModelStats(allTrades);
                if (modelId) {
                    return stats.filter((s) => s.modelId === modelId);
                }
                return stats;
            },

            getCurrentSessionStats: () => {
                const { currentSession } = get();
                if (!currentSession) return [];
                return calculateModelStats(currentSession.trades);
            },
        }),
        {
            name: 'live-session-storage',
            partialize: (state) => ({
                measurementMode: state.measurementMode,
                currentSession: state.currentSession,
                sessionHistory: state.sessionHistory,
            }),
        }
    )
);
