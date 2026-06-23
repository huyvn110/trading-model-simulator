import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsState {
    markets: string[];
    sessions: string[];
    mistakes: string[];

    addMarket: (market: string) => void;
    removeMarket: (market: string) => void;
    
    addSession: (session: string) => void;
    removeSession: (session: string) => void;
    
    addMistake: (mistake: string) => void;
    removeMistake: (mistake: string) => void;
}

const DEFAULT_MARKETS = ['mgc', 'mNQ', 'ES', 'NQ', 'GC', 'CL'];
const DEFAULT_SESSIONS = ['Asia', 'London', 'NY'];
const DEFAULT_MISTAKES = ['None', 'FOMO', 'Moved SL', 'Không đợi cisd', 'Vào sớm', 'Sai cấu trúc', 'Lỗi tâm lý'];

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            markets: DEFAULT_MARKETS,
            sessions: DEFAULT_SESSIONS,
            mistakes: DEFAULT_MISTAKES,

            addMarket: (market: string) => set((state) => ({
                markets: state.markets.includes(market) ? state.markets : [...state.markets, market]
            })),
            removeMarket: (market: string) => set((state) => ({
                markets: state.markets.filter(m => m !== market)
            })),

            addSession: (session: string) => set((state) => ({
                sessions: state.sessions.includes(session) ? state.sessions : [...state.sessions, session]
            })),
            removeSession: (session: string) => set((state) => ({
                sessions: state.sessions.filter(s => s !== session)
            })),

            addMistake: (mistake: string) => set((state) => ({
                mistakes: state.mistakes.includes(mistake) ? state.mistakes : [...state.mistakes, mistake]
            })),
            removeMistake: (mistake: string) => set((state) => ({
                mistakes: state.mistakes.filter(m => m !== mistake)
            })),
        }),
        {
            name: 'trade-settings-storage',
        }
    )
);
