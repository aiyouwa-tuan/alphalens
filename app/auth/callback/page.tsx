'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        if (!supabase) {
            console.error('Supabase not configured');
            router.push('/login?error=config_missing');
            return;
        }
        const client = supabase; // Bind non-null for TS narrowing

        const handleAuthCallback = async () => {
            const { data: { session }, error } = await client.auth.getSession();

            if (error) {
                console.error('Auth callback error:', error);
                router.push('/login?error=auth_failed');
            } else if (session) {
                try {
                    await fetch('/api/auth/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: session.user.id })
                    });
                } catch (e) {
                    console.error("Cookie sync failed:", e);
                }
                router.push('/dashboard');
            } else {
                const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
                    if (event === 'SIGNED_IN' && session) {
                        try {
                            await fetch('/api/auth/sync', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: session.user.id })
                            });
                        } catch (e) {
                            console.error("Cookie sync failed:", e);
                        }
                        router.push('/dashboard');
                    }
                });

                setTimeout(async () => {
                    const { data: { session: retrySession } } = await client.auth.getSession();
                    if (retrySession) router.push('/dashboard');
                    else router.push('/login');
                }, 2000);

                return () => subscription.unsubscribe();
            }
        };

        handleAuthCallback();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] text-[var(--text-primary)]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-[var(--text-accent)] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[var(--text-secondary)]">Completing sign in...</p>
            </div>
        </div>
    );
}
