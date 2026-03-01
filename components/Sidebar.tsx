'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { createClient } from '@supabase/supabase-js';
import { useLanguage } from '@/components/LanguageProvider';

// Simple SVG Icons
const Icons = {
    Logo: () => (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-[var(--text-accent)]" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
    ),
    Dashboard: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
        </svg>
    ),
    Watchlist: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
    ),
    News: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
    ),
    Settings: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
    ),
    Analysis: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
            <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
            <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
            <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
            <path d="M6.002 6.5A3 3 0 0 1 5.604 5.126" />
            <path d="M11.8 23a38.6 38.6 0 0 1-1.884-2.483" />
            <path d="M12 23a38.6 38.6 0 0 0 1.884-2.483" />
        </svg>
    )
};

const NavItem = ({ href, Icon, active, label }: { href: string; Icon: any; active: boolean; label: string }) => (
    <Link href={href} className={clsx(
        "w-10 h-10 flex items-center justify-center rounded-lg transition-colors mb-4 group relative",
        active ? "bg-[var(--text-accent)] text-white shadow-lg shadow-blue-500/20" : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-white"
    )}>
        <div className="w-5 h-5">
            <Icon />
        </div>

        {/* Tooltip */}
        <span className="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-gray-700">
            {label}
        </span>
    </Link>
);

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const { t } = useLanguage();

    // Initialize Supabase (Client Component) - Safe Fallback
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let supabase: any = null;
    try {
        if (supabaseUrl && supabaseKey) {
            supabase = createClient(supabaseUrl, supabaseKey);
        }
    } catch (e) {
        console.error("Supabase Init Failed:", e);
        supabase = null;
    }

    useEffect(() => {
        if (!supabase) return;

        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };
        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleLogout = async () => {
        if (!supabase) {
            // If no supabase, just clear local state/redirect
            setUser(null);
            router.push('/login');
            return;
        }
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <div className="w-16 h-screen flex flex-col items-center py-6 bg-[var(--bg-app)] border-r border-[var(--border-subtle)] fixed left-0 top-0 z-50">
            <div className="mb-8">
                <Icons.Logo />
            </div>

            <nav className="flex-1 w-full flex flex-col items-center">
                <NavItem href="/dashboard" Icon={Icons.Dashboard} active={pathname === '/dashboard'} label={t('dashboard')} />
                <NavItem href="/analysis" Icon={Icons.Analysis} active={pathname === '/analysis'} label="AI Analysis" />
                <NavItem href="/dashboard/news" Icon={Icons.News} active={pathname === '/dashboard/news'} label={t('news')} />
                <NavItem href="/dashboard/settings" Icon={Icons.Settings} active={pathname === '/dashboard/settings'} label={t('settings')} />
            </nav>

            <div className="mt-auto mb-4 flex flex-col gap-4 items-center">
                {user ? (
                    // Authenticated: Show Avatar (Click to Logout/Profile)
                    <button
                        onClick={handleLogout}
                        title={t('logout')}
                        className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 border border-white/20 hover:ring-2 hover:ring-white/50 transition-all flex items-center justify-center text-xs font-bold text-white shadow-lg"
                    >
                        {user.email?.[0].toUpperCase() || 'U'}
                    </button>
                ) : (
                    // Guest: Show Login Button
                    <Link
                        href="/login"
                        title={t('login')}
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-[var(--text-accent)] hover:bg-[var(--text-accent)] hover:text-white transition-all"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                            <polyline points="10 17 15 12 10 7" />
                            <line x1="15" y1="12" x2="3" y2="12" />
                        </svg>
                    </Link>
                )}
            </div>
        </div>
    );
}
