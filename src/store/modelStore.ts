'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { TradingModel } from '@/types';

interface ModelState {
    models: TradingModel[];
    selectedModelId: string | null;
    addModel: (name: string, factors: string[]) => void;
    updateModel: (id: string, name: string, factors: string[]) => void;
    deleteModel: (id: string) => void;
    selectModel: (id: string | null) => void;
    reorderModels: (activeId: string, overId: string) => void;
    getSelectedModel: () => TradingModel | null;
}

export const useModelStore = create<ModelState>()(
    persist(
        (set, get) => ({
            models: [],
            selectedModelId: null,

            addModel: (name: string, factors: string[]) => {
                set((state) => ({
                    models: [
                        ...state.models,
                        {
                            id: uuidv4(),
                            name,
                            factors,
                            order: state.models.length,
                        },
                    ],
                }));
            },

            updateModel: (id: string, name: string, factors: string[]) => {
                set((state) => ({
                    models: state.models.map((m) =>
                        m.id === id ? { ...m, name, factors } : m
                    ),
                }));
            },

            deleteModel: (id: string) => {
                set((state) => ({
                    models: state.models
                        .filter((m) => m.id !== id)
                        .map((m, index) => ({ ...m, order: index })),
                    selectedModelId:
                        state.selectedModelId === id ? null : state.selectedModelId,
                }));
            },

            selectModel: (id: string | null) => {
                set({ selectedModelId: id });
            },

            reorderModels: (activeId: string, overId: string) => {
                set((state) => {
                    const models = [...state.models];
                    const activeIndex = models.findIndex((m) => m.id === activeId);
                    const overIndex = models.findIndex((m) => m.id === overId);

                    if (activeIndex === -1 || overIndex === -1) return state;

                    const [removed] = models.splice(activeIndex, 1);
                    models.splice(overIndex, 0, removed);

                    return {
                        models: models.map((m, index) => ({ ...m, order: index })),
                    };
                });
            },

            getSelectedModel: () => {
                const { models, selectedModelId } = get();
                return models.find((m) => m.id === selectedModelId) || null;
            },
        }),
        {
            name: 'model-storage',
        }
    )
);
