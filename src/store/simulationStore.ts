import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
    SimulationSettings,
    SimulationState,
    SimulationSession,
    SimulationIteration,
    ModelStats,
    Factor,
} from '@/types';

interface SimulationStore {
    // Settings
    settings: SimulationSettings;
    updateSettings: (settings: Partial<SimulationSettings>) => void;

    // Current simulation state
    state: SimulationState;
    currentSession: SimulationSession | null;
    currentIteration: number;

    // History
    history: SimulationSession[];

    // Actions
    startSimulation: (factors: Factor[]) => void;
    pauseSimulation: () => void;
    resumeSimulation: () => void;
    stopSimulation: () => void;
    addIteration: (iteration: SimulationIteration) => void;
    completeSimulation: () => void;
    clearHistory: () => void;
    deleteSession: (id: string) => void;
}

const calculateModelStats = (iterations: SimulationIteration[]): ModelStats[] => {
    const modelCounts: Record<string, { count: number; factorNames: string[] }> = {};

    iterations.forEach((iter) => {
        if (!modelCounts[iter.modelKey]) {
            modelCounts[iter.modelKey] = {
                count: 0,
                factorNames: iter.modelKey.split('+'),
            };
        }
        modelCounts[iter.modelKey].count++;
    });

    const total = iterations.length;
    return Object.entries(modelCounts)
        .map(([modelKey, data]) => ({
            modelKey,
            factorNames: data.factorNames,
            count: data.count,
            percentage: total > 0 ? (data.count / total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);
};

export const useSimulationStore = create<SimulationStore>()(
    persist(
        (set, get) => ({
            settings: {
                iterationCount: 100,
                speed: 50,
                minFactorsPerIteration: 1,
                maxFactorsPerIteration: 3,
            },

            state: 'idle',
            currentSession: null,
            currentIteration: 0,
            history: [],

            updateSettings: (newSettings) => {
                set((state) => ({
                    settings: { ...state.settings, ...newSettings },
                }));
            },

            startSimulation: (factors: Factor[]) => {
                const session: SimulationSession = {
                    id: uuidv4(),
                    timestamp: Date.now(),
                    factorsSnapshot: factors,
                    iterations: [],
                    totalIterations: get().settings.iterationCount,
                    modelStats: [],
                };

                set({
                    state: 'running',
                    currentSession: session,
                    currentIteration: 0,
                });
            },

            pauseSimulation: () => {
                set({ state: 'paused' });
            },

            resumeSimulation: () => {
                set({ state: 'running' });
            },

            stopSimulation: () => {
                const { currentSession } = get();
                if (currentSession && currentSession.iterations.length > 0) {
                    const modelStats = calculateModelStats(currentSession.iterations);
                    const completedSession = { ...currentSession, modelStats };
                    set((state) => ({
                        state: 'idle',
                        currentSession: null,
                        currentIteration: 0,
                        history: [completedSession, ...state.history].slice(0, 50),
                    }));
                } else {
                    set({
                        state: 'idle',
                        currentSession: null,
                        currentIteration: 0,
                    });
                }
            },

            addIteration: (iteration: SimulationIteration) => {
                set((state) => {
                    if (!state.currentSession) return state;

                    const newIterations = [...state.currentSession.iterations, iteration];
                    const modelStats = calculateModelStats(newIterations);

                    return {
                        currentIteration: state.currentIteration + 1,
                        currentSession: {
                            ...state.currentSession,
                            iterations: newIterations,
                            modelStats,
                        },
                    };
                });
            },

            completeSimulation: () => {
                const { currentSession } = get();
                if (currentSession) {
                    const modelStats = calculateModelStats(currentSession.iterations);
                    const completedSession = { ...currentSession, modelStats };
                    set((state) => ({
                        state: 'completed',
                        currentSession: completedSession,
                        history: [completedSession, ...state.history].slice(0, 50),
                    }));
                }
            },

            clearHistory: () => {
                set({ history: [] });
            },

            deleteSession: (id: string) => {
                set((state) => ({
                    history: state.history.filter((s) => s.id !== id),
                }));
            },
        }),
        {
            name: 'simulation-storage',
            partialize: (state) => ({
                settings: state.settings,
                history: state.history,
            }),
        }
    )
);
