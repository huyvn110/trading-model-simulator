'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useLiveSessionStore } from '@/store/liveSessionStore';

export default function CloudSyncProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const isFirstLoad = useRef(true);
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Only run when session is authenticated
        if (status !== 'authenticated' || !session?.user) return;

        const syncStore = async () => {
            if (isFirstLoad.current) {
                // Initial Load: Fetch from cloud
                try {
                    console.log('Fetching cloud data...');
                    const res = await fetch('/api/sync?storeName=liveSessionStore');
                    const data = await res.json();

                    if (data.state) {
                        useLiveSessionStore.setState(data.state);
                        console.log('Cloud data loaded successfully!');
                    }
                } catch (error) {
                    console.error('Failed to load cloud data:', error);
                } finally {
                    isFirstLoad.current = false;
                }
            }
        };

        syncStore();

        // Subscribe to store changes to push to cloud
        const unsubscribe = useLiveSessionStore.subscribe((state, prevState) => {
            if (isFirstLoad.current) return; // Don't push before we finish loading

            // Debounce push to avoid spamming the API on every keystroke
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

            syncTimeoutRef.current = setTimeout(async () => {
                try {
                    console.log('Pushing updates to cloud...');
                    await fetch('/api/sync', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            storeName: 'liveSessionStore',
                            state: {
                                measurementMode: state.measurementMode,
                                currentSession: state.currentSession,
                                sessionHistory: state.sessionHistory,
                            },
                        }),
                    });
                    console.log('Cloud sync complete!');
                } catch (error) {
                    console.error('Failed to push to cloud:', error);
                }
            }, 2000); // Wait 2 seconds of inactivity before pushing
        });

        return () => {
            unsubscribe();
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        };
    }, [status, session]);

    return <>{children}</>;
}
