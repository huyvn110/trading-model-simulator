import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Factor } from '@/types';

interface FactorState {
    factors: Factor[];
    addFactor: (name: string) => void;
    updateFactor: (id: string, name: string) => void;
    deleteFactor: (id: string) => void;
    toggleFactor: (id: string) => void;
    toggleAll: (selected: boolean) => void;
    reorderFactors: (activeId: string, overId: string) => void;
    getSelectedFactors: () => Factor[];
}

export const useFactorStore = create<FactorState>()(
    persist(
        (set, get) => ({
            factors: [
                { id: '1', name: 'Factor A', selected: true, order: 0 },
                { id: '2', name: 'Factor B', selected: true, order: 1 },
                { id: '3', name: 'Factor C', selected: true, order: 2 },
                { id: '4', name: 'Factor D', selected: false, order: 3 },
                { id: '5', name: 'Factor E', selected: false, order: 4 },
            ],

            addFactor: (name: string) => {
                set((state) => ({
                    factors: [
                        ...state.factors,
                        {
                            id: uuidv4(),
                            name,
                            selected: true,
                            order: state.factors.length,
                        },
                    ],
                }));
            },

            updateFactor: (id: string, name: string) => {
                set((state) => ({
                    factors: state.factors.map((f) =>
                        f.id === id ? { ...f, name } : f
                    ),
                }));
            },

            deleteFactor: (id: string) => {
                set((state) => ({
                    factors: state.factors
                        .filter((f) => f.id !== id)
                        .map((f, index) => ({ ...f, order: index })),
                }));
            },

            toggleFactor: (id: string) => {
                set((state) => ({
                    factors: state.factors.map((f) =>
                        f.id === id ? { ...f, selected: !f.selected } : f
                    ),
                }));
            },

            toggleAll: (selected: boolean) => {
                set((state) => ({
                    factors: state.factors.map((f) => ({ ...f, selected })),
                }));
            },

            reorderFactors: (activeId: string, overId: string) => {
                set((state) => {
                    const factors = [...state.factors];
                    const activeIndex = factors.findIndex((f) => f.id === activeId);
                    const overIndex = factors.findIndex((f) => f.id === overId);

                    if (activeIndex === -1 || overIndex === -1) return state;

                    const [removed] = factors.splice(activeIndex, 1);
                    factors.splice(overIndex, 0, removed);

                    return {
                        factors: factors.map((f, index) => ({ ...f, order: index })),
                    };
                });
            },

            getSelectedFactors: () => {
                return get().factors.filter((f) => f.selected);
            },
        }),
        {
            name: 'factor-storage',
        }
    )
);
