'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuth() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
            setLoading(false);
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const logout = useCallback(async () => {
        try {
            if (supabase) {
                await supabase.auth.signOut();
            }
            await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        } catch (e) {
            console.error("Logout error:", e);
        }
        window.location.reload();
    }, []);

    return { user, loading, logout };
}
