'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        // The Supabase client automatically handles the OAuth callback by parsing the URL hash/query
        // and persisting the session to localStorage.
        // We just need to wait a moment or check session, then redirect.

        const handleAuthCallback = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Auth callback error:', error);
                // Optionally show error to user
                router.push('/login?error=auth_failed');
            } else if (session) {
                // Successful login
                router.push('/dashboard');
            } else {
                // No session found? Might need to wait for the client to process the URL hash?
                // Supabase-js usually does this synchronously on init/getSession if the URL has the params.
                // But just in case, we can listen for the state change.
                const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                    if (event === 'SIGNED_IN' && session) {
                        router.push('/dashboard');
                    }
                });

                // Fallback check after short delay if no event fires (e.g. already handled)
                setTimeout(async () => {
                    const { data: { session: retrySession } } = await supabase.auth.getSession();
                    if (retrySession) router.push('/dashboard');
                    else router.push('/login'); // Fallback
                }, 2000);

                return () => subscription.unsubscribe();
            }
        };

        handleAuthCallback();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-[var(--text-accent)] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[var(--text-secondary)]">Completing sign in...</p>
            </div>
        </div>
    );
}
