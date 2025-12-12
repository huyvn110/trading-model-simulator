'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { MeasurementMode, Factor } from '@/types';

// Test trade entry
export interface TestTrade {
    id: string;
    timestamp: number;
    factorIds: string[];
    modelKey: string; // sorted factor IDs joined (stable even when names change)
    measurementValue: number;
    result: 'win' | 'lose';
    notes?: string;
    images?: string[];
}

// Test session
export interface TestSession {
    id: string;
    name: string;
    startTime: number;
    endTime?: number;
    measurementMode: MeasurementMode;
    trades: TestTrade[];
}

// Model stats for test
export interface TestModelStats {
    modelKey: string;
    factorIds: string[];
    factorNames: string[]; // resolved from current factor names
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    totalValue: number;
    winValue: number;
    lossValue: number;
}

interface TestSessionState {
    // Settings
    measurementMode: MeasurementMode;
    setMeasurementMode: (mode: MeasurementMode) => void;

    // Current session
    currentSession: TestSession | null;
    createSession: (name: string) => void;
    endSession: () => void;

    // Sessions list
    sessions: TestSession[];
    selectSession: (id: string) => void;
    deleteSession: (id: string) => void;

    // Trade management
    addTrade: (
        factors: Factor[],
        value: number,
        result: 'win' | 'lose',
        notes?: string,
        images?: string[]
    ) => void;
    updateTradeNotes: (tradeId: string, notes: string) => void;
    addTradeImage: (tradeId: string, image: string) => void;
    removeTradeImage: (tradeId: string, imageIndex: number) => void;
    deleteTrade: (tradeId: string) => void;
    renameSession: (sessionId: string, newName: string) => void;

    // Stats - need factor name resolver
    getCurrentSessionStats: (getFactorName: (id: string) => string) => TestModelStats[];
    getTotalStats: () => { trades: number; models: number; winRate: number; totalValue: number };
}

const calculateModelStats = (
    trades: TestTrade[],
    getFactorName: (id: string) => string
): TestModelStats[] => {
    const statsMap: Record<string, TestModelStats> = {};

    trades.forEach((trade) => {
        if (!statsMap[trade.modelKey]) {
            // Resolve current names from factor IDs
            const factorNames = trade.factorIds.map(getFactorName).sort();
            statsMap[trade.modelKey] = {
                modelKey: trade.modelKey,
                factorIds: trade.factorIds,
                factorNames,
                totalTrades: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                totalValue: 0,
                winValue: 0,
                lossValue: 0,
            };
        }

        const stats = statsMap[trade.modelKey];
        stats.totalTrades++;
        if (trade.result === 'win') {
            stats.totalValue += trade.measurementValue;
            stats.winValue += trade.measurementValue;
            stats.wins++;
        } else {
            stats.totalValue -= trade.measurementValue;
            stats.lossValue += trade.measurementValue;
            stats.losses++;
        }

        stats.winRate = stats.totalTrades > 0
            ? (stats.wins / stats.totalTrades) * 100
            : 0;
    });

    return Object.values(statsMap).sort((a, b) => b.totalTrades - a.totalTrades);
};

export const useTestSessionStore = create<TestSessionState>()(
    persist(
        (set, get) => ({
            measurementMode: 'RR',
            currentSession: null,
            sessions: [],

            setMeasurementMode: (mode: MeasurementMode) => {
                if (!get().currentSession) {
                    set({ measurementMode: mode });
                }
            },

            createSession: (name: string) => {
                const session: TestSession = {
                    id: uuidv4(),
                    name,
                    startTime: Date.now(),
                    measurementMode: get().measurementMode,
                    trades: [],
                };
                set((state) => ({
                    currentSession: session,
                    sessions: [session, ...state.sessions],
                }));
            },

            endSession: () => {
                const { currentSession } = get();
                if (currentSession) {
                    const endedSession = { ...currentSession, endTime: Date.now() };
                    set((state) => ({
                        currentSession: null,
                        sessions: state.sessions.map((s) =>
                            s.id === endedSession.id ? endedSession : s
                        ),
                    }));
                }
            },

            selectSession: (id: string) => {
                const session = get().sessions.find((s) => s.id === id);
                if (session) {
                    set({ currentSession: session });
                }
            },

            deleteSession: (id: string) => {
                set((state) => ({
                    sessions: state.sessions.filter((s) => s.id !== id),
                    currentSession: state.currentSession?.id === id ? null : state.currentSession,
                }));
            },

            renameSession: (id: string, newName: string) => {
                set((state) => {
                    const updatedSessions = state.sessions.map((s) =>
                        s.id === id ? { ...s, name: newName } : s
                    );
                    const updatedCurrentSession =
                        state.currentSession?.id === id
                            ? { ...state.currentSession, name: newName }
                            : state.currentSession;

                    return {
                        sessions: updatedSessions,
                        currentSession: updatedCurrentSession,
                    };
                });
            },

            addTrade: (
                factors: Factor[],
                value: number,
                result: 'win' | 'lose',
                notes?: string,
                images?: string[]
            ) => {
                const { currentSession } = get();
                if (!currentSession) return;

                const sortedFactorIds = factors
                    .map((f) => f.id)
                    .sort();

                const trade: TestTrade = {
                    id: uuidv4(),
                    timestamp: Date.now(),
                    factorIds: sortedFactorIds,
                    modelKey: sortedFactorIds.join('+'), // Use IDs for stable key
                    measurementValue: value,
                    result,
                    notes,
                    images,
                };

                set((state) => {
                    const updatedSession = {
                        ...state.currentSession!,
                        trades: [...state.currentSession!.trades, trade],
                    };
                    return {
                        currentSession: updatedSession,
                        sessions: state.sessions.map((s) =>
                            s.id === updatedSession.id ? updatedSession : s
                        ),
                    };
                });
            },

            updateTradeNotes: (tradeId: string, notes: string) => {
                set((state) => {
                    if (!state.currentSession) return state;

                    const updatedSession = {
                        ...state.currentSession,
                        trades: state.currentSession.trades.map((t) =>
                            t.id === tradeId ? { ...t, notes } : t
                        ),
                    };
                    return {
                        currentSession: updatedSession,
                        sessions: state.sessions.map((s) =>
                            s.id === updatedSession.id ? updatedSession : s
                        ),
                    };
                });
            },

            addTradeImage: (tradeId: string, image: string) => {
                set((state) => {
                    if (!state.currentSession) return state;

                    const updatedSession = {
                        ...state.currentSession,
                        trades: state.currentSession.trades.map((t) =>
                            t.id === tradeId
                                ? { ...t, images: [...(t.images || []), image] }
                                : t
                        ),
                    };
                    return {
                        currentSession: updatedSession,
                        sessions: state.sessions.map((s) =>
                            s.id === updatedSession.id ? updatedSession : s
                        ),
                    };
                });
            },

            removeTradeImage: (tradeId: string, imageIndex: number) => {
                set((state) => {
                    if (!state.currentSession) return state;

                    const updatedSession = {
                        ...state.currentSession,
                        trades: state.currentSession.trades.map((t) =>
                            t.id === tradeId
                                ? { ...t, images: t.images?.filter((_, i) => i !== imageIndex) }
                                : t
                        ),
                    };
                    return {
                        currentSession: updatedSession,
                        sessions: state.sessions.map((s) =>
                            s.id === updatedSession.id ? updatedSession : s
                        ),
                    };
                });
            },

            deleteTrade: (tradeId: string) => {
                set((state) => {
                    if (!state.currentSession) return state;

                    const updatedSession = {
                        ...state.currentSession,
                        trades: state.currentSession.trades.filter((t) => t.id !== tradeId),
                    };
                    return {
                        currentSession: updatedSession,
                        sessions: state.sessions.map((s) =>
                            s.id === updatedSession.id ? updatedSession : s
                        ),
                    };
                });
            },

            getCurrentSessionStats: (getFactorName: (id: string) => string) => {
                const { currentSession } = get();
                if (!currentSession) return [];
                return calculateModelStats(currentSession.trades, getFactorName);
            },

            getTotalStats: () => {
                const { currentSession } = get();
                if (!currentSession) {
                    return { trades: 0, models: 0, winRate: 0, totalValue: 0 };
                }

                const trades = currentSession.trades;
                const wins = trades.filter((t) => t.result === 'win').length;
                const models = new Set(trades.map((t) => t.modelKey)).size;
                const totalValue = trades.reduce((sum, t) => {
                    return sum + (t.result === 'win' ? t.measurementValue : -t.measurementValue);
                }, 0);

                return {
                    trades: trades.length,
                    models,
                    winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
                    totalValue,
                };
            },
        }),
        {
            name: 'test-session-storage',
            partialize: (state) => ({
                measurementMode: state.measurementMode,
                currentSession: state.currentSession,
                sessions: state.sessions,
            }),
        }
    )
);
