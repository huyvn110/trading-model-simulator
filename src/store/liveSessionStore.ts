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

interface LiveSessionState {
    // Settings
    measurementMode: MeasurementMode;
    setMeasurementMode: (mode: MeasurementMode) => void;

    // Current session
    currentSession: LiveSession | null;
    startSession: () => void;
    endSession: () => void;

    // Trade management
    addTrade: (
        modelId: string,
        modelName: string,
        value: number,
        profitRatio: number | undefined,
        result: 'win' | 'lose',
        notes?: string,
        images?: string[],
        content?: ContentBlock[]
    ) => void;
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

            startSession: () => {
                const session: LiveSession = {
                    id: uuidv4(),
                    startTime: Date.now(),
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

            addTrade: (
                modelId: string,
                modelName: string,
                value: number,
                profitRatio: number | undefined,
                result: 'win' | 'lose',
                notes?: string,
                images?: string[],
                content?: ContentBlock[]
            ) => {
                const { currentSession, measurementMode } = get();

                // Calculate final value for win trades with profit ratio
                let finalValue = value;
                if (result === 'win' && profitRatio && profitRatio > 0) {
                    if (measurementMode === 'RR') {
                        finalValue = value * profitRatio;
                    } else {
                        finalValue = value * (1 + profitRatio / 100);
                    }
                }

                const trade: LiveTrade = {
                    id: uuidv4(),
                    timestamp: Date.now(),
                    modelId,
                    modelName,
                    measurementValue: finalValue,
                    profitRatio,
                    result,
                    notes,
                    images,
                    content,
                };

                set((state) => {
                    if (!state.currentSession) {
                        // Auto-start session if not started
                        const session: LiveSession = {
                            id: uuidv4(),
                            startTime: Date.now(),
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
