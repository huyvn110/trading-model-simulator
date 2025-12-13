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
    toggleFactor: (modelId: string, factor: string) => void;
    resetChecklist: (modelId: string) => void;
    areAllFactorsChecked: (modelId: string) => boolean;
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
                            checkedFactors: [],
                            order: state.models.length,
                        },
                    ],
                }));
            },

            updateModel: (id: string, name: string, factors: string[]) => {
                set((state) => ({
                    models: state.models.map((m) =>
                        m.id === id ? { ...m, name, factors, checkedFactors: [] } : m
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
                set((state) => ({
                    selectedModelId: id,
                    models: state.models.map((m) => {
                        if (id === null) {
                            // Deselecting - clear current model's checklist
                            if (m.id === state.selectedModelId) {
                                return { ...m, checkedFactors: [] };
                            }
                            return m;
                        }
                        if (m.id === id) {
                            // Selecting - check all factors
                            return { ...m, checkedFactors: [...m.factors] };
                        }
                        return m;
                    }),
                }));
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

            toggleFactor: (modelId: string, factor: string) => {
                set((state) => {
                    const updatedModels = state.models.map((m) => {
                        if (m.id !== modelId) return m;
                        const checkedFactors = m.checkedFactors || [];
                        const isChecked = checkedFactors.includes(factor);
                        return {
                            ...m,
                            checkedFactors: isChecked
                                ? checkedFactors.filter((f) => f !== factor)
                                : [...checkedFactors, factor],
                        };
                    });

                    // Check updated model state
                    const updatedModel = updatedModels.find((m) => m.id === modelId);
                    const checkedCount = (updatedModel?.checkedFactors || []).length;
                    const totalFactors = updatedModel?.factors.length || 0;

                    // Auto-select when all checked, auto-deselect when not all checked
                    const allChecked = totalFactors > 0 && checkedCount === totalFactors;

                    let newSelectedId = state.selectedModelId;
                    if (allChecked) {
                        newSelectedId = modelId;
                    } else if (state.selectedModelId === modelId) {
                        // Deselect if any factor is unchecked
                        newSelectedId = null;
                    }

                    return {
                        models: updatedModels,
                        selectedModelId: newSelectedId,
                    };
                });
            },

            resetChecklist: (modelId: string) => {
                set((state) => ({
                    models: state.models.map((m) =>
                        m.id === modelId ? { ...m, checkedFactors: [] } : m
                    ),
                }));
            },

            areAllFactorsChecked: (modelId: string) => {
                const model = get().models.find((m) => m.id === modelId);
                if (!model || model.factors.length === 0) return true;
                const checkedFactors = model.checkedFactors || [];
                return model.factors.every((f) => checkedFactors.includes(f));
            },
        }),
        {
            name: 'model-storage',
            partialize: (state) => ({
                // Only persist models without runtime checkedFactors state
                models: state.models.map(m => ({
                    id: m.id,
                    name: m.name,
                    factors: m.factors,
                    order: m.order,
                    checkedFactors: [], // Reset checkedFactors on persist
                })),
                selectedModelId: null, // Don't persist selection
            }),
        }
    )
);
