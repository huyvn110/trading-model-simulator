'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { ContentBlock } from '@/types';

// Note Page interface
export interface NotePage {
    id: string;
    title: string;
    content: ContentBlock[];
    createdAt: number;
    updatedAt: number;
    order: number;
}

interface NoteState {
    pages: NotePage[];
    selectedPageId: string | null;

    // CRUD operations
    createPage: (title?: string) => string;
    updatePage: (id: string, updates: Partial<Pick<NotePage, 'title' | 'content'>>) => void;
    deletePage: (id: string) => void;

    // Selection
    selectPage: (id: string | null) => void;
    getSelectedPage: () => NotePage | null;

    // Reorder
    reorderPages: (pages: NotePage[]) => void;
}

export const useNoteStore = create<NoteState>()(
    persist(
        (set, get) => ({
            pages: [],
            selectedPageId: null,

            createPage: (title?: string) => {
                const id = uuidv4();
                const now = Date.now();
                const newPage: NotePage = {
                    id,
                    title: title || 'New page',
                    content: [],
                    createdAt: now,
                    updatedAt: now,
                    order: get().pages.length,
                };

                set((state) => ({
                    pages: [...state.pages, newPage],
                    selectedPageId: id,
                }));

                return id;
            },

            updatePage: (id, updates) => {
                set((state) => ({
                    pages: state.pages.map((page) =>
                        page.id === id
                            ? { ...page, ...updates, updatedAt: Date.now() }
                            : page
                    ),
                }));
            },

            deletePage: (id) => {
                set((state) => ({
                    pages: state.pages.filter((page) => page.id !== id),
                    selectedPageId:
                        state.selectedPageId === id ? null : state.selectedPageId,
                }));
            },

            selectPage: (id) => {
                set({ selectedPageId: id });
            },

            getSelectedPage: () => {
                const { pages, selectedPageId } = get();
                return pages.find((page) => page.id === selectedPageId) || null;
            },

            reorderPages: (pages) => {
                set({ pages });
            },
        }),
        {
            name: 'trade-notes-storage',
            partialize: (state) => ({
                pages: state.pages,
            }),
        }
    )
);
