'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuth() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const client = supabase;

        const fetchCookieUser = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    return data.user || null;
                }
            } catch (e) {
                // ignore
            }
            return null;
        };

        const init = async () => {
            // Check cookie-based session first (admin bypass)
            const cookieUser = await fetchCookieUser();
            if (cookieUser?.isAdmin) {
                setUser(cookieUser);
                setLoading(false);
                return;
            }

            // Then check Supabase session
            if (client) {
                const { data: { session } } = await client.auth.getSession();
                if (session?.user) {
                    setUser(session.user);
                    setLoading(false);
                    return;
                }
            }

            setUser(cookieUser);
            setLoading(false);
        };

        init();

        if (client) {
            const { data: { subscription } } = client.auth.onAuthStateChange((_event: any, session: any) => {
                setUser((prevUser: any) => {
                    if (prevUser?.isAdmin) return prevUser;
                    return session?.user || null;
                });
            });
            return () => subscription.unsubscribe();
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            const client = supabase;
            if (client) {
                await client.auth.signOut();
            }
            await fetch('/api/auth/logout', { method: 'POST' }).catch(() => { });
        } catch (e) {
            console.error("Logout error:", e);
        }
        window.location.reload();
    }, []);

    return { user, loading, logout };
}
