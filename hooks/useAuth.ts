'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuth() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Assign to local const so TypeScript can properly narrow the type
        // inside async closures (supabase is SupabaseClient | null)
        const client = supabase;
        if (!client) {
            setLoading(false);
            return;
        }

        const checkUser = async () => {
            // Check custom API first for admin bypass
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.user?.isAdmin) {
                        setUser(data.user);
                        setLoading(false);
                        return;
                    }
                }
            } catch (e) {
                console.error("Failed to fetch custom auth:", e);
            }

            const { data: { session } } = await client.auth.getSession();
            setUser(session?.user || null);
            setLoading(false);
        };
        checkUser();

        const { data: { subscription } } = client.auth.onAuthStateChange((_event: any, session: any) => {
            // If already set to admin, ignore supabase auth state changes mapping to null
            setUser((prevUser: any) => {
                if (prevUser?.isAdmin) return prevUser;
                return session?.user || null;
            });
        });

        return () => subscription.unsubscribe();
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
