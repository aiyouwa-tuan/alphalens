'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useLanguage } from '@/components/LanguageProvider';
import { clsx } from 'clsx';
import { Activity, BrainCircuit, Globe, Settings, LogOut, LogIn, Menu, X } from 'lucide-react';

interface MarketItem {
    symbol: string;
    value: string;
    change: string;
    up: boolean;
    timeStr: string;
}

const Icons = {
    Logo: () => (
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-[var(--text-accent)]" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
    ),
};

export default function TopBar() {
    const { t, language, setLanguage } = useLanguage();
    const pathname = usePathname();
    const router = useRouter();

    // Auth State
    const [user, setUser] = useState<any>(null);
    let supabase: any = null;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    try {
        if (supabaseUrl && supabaseKey) {
            supabase = createClient(supabaseUrl, supabaseKey);
        }
    } catch (e) {
        console.error("Supabase Init Failed:", e);
    }

    useEffect(() => {
        if (!supabase) return;
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            setUser(session?.user || null);
        });
        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleLogout = async () => {
        if (supabase) await supabase.auth.signOut();
        setUser(null);
        router.push('/login');
        router.refresh();
    };

    // Market Ticker State
    const [indices, setIndices] = useState<MarketItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/market-overview');
                if (!res.ok) throw new Error('Failed');
                const data = await res.json();

                const formatItem = (name: string, item: any) => {
                    if (!item) return null;
                    const change = item.changePercent || 0;
                    return {
                        symbol: name,
                        value: (item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                        change: (change > 0 ? '+' : '') + change.toFixed(1) + '%',
                        up: change >= 0,
                        timeStr: 'Recent'
                    };
                };

                const newIndices = [
                    formatItem('S&P 500', data.indices?.us?.find((x: any) => x.symbol === '^GSPC')),
                    formatItem('NASDAQ', data.indices?.us?.find((x: any) => x.symbol === '^IXIC')),
                    formatItem('DOW', data.indices?.us?.find((x: any) => x.symbol === '^DJI')),
                    formatItem('GOLD', data.commodities?.find((x: any) => x.symbol === 'Gold')),
                    formatItem('BTC', data.commodities?.find((x: any) => x.symbol === 'BTC'))
                ].filter(Boolean) as MarketItem[];

                setIndices(newIndices);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [language]);

    const NavItem = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
        const active = pathname === href;
        return (
            <Link href={href} className={clsx(
                "flex flex-row items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                active ? "bg-[var(--bg-subtle)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-white"
            )}>
                <Icon className="w-4 h-4" />
                <span>{label}</span>
            </Link>
        );
    };

    return (
        <div className="h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-app)] flex flex-row items-center justify-between px-6 sticky top-0 z-50">
            {/* Left Box: Logo & Nav Links */}
            <div className="flex flex-row items-center gap-8">
                <Link href="/" className="flex flex-row items-center gap-3">
                    <Icons.Logo />
                    <span className="font-bold text-lg hidden sm:block tracking-tight text-white">AlphaLens</span>
                </Link>

                <nav className="hidden md:flex flex-row items-center gap-1">
                    <NavItem href="/dashboard" icon={Activity} label={t('dashboard')} />
                    <NavItem href="/analysis" icon={BrainCircuit} label="AI Analysis" />
                    <NavItem href="/dashboard/news" icon={Globe} label={t('news')} />
                    <NavItem href="/dashboard/settings" icon={Settings} label={t('settings')} />
                </nav>
            </div>

            {/* Center: Mini Ticker (Optional depending on width) */}
            <div className="hidden lg:flex items-center gap-6 overflow-hidden max-w-lg">
                {!loading && indices.map((item) => (
                    <div key={item.symbol} className="flex items-center gap-1.5 text-xs font-mono">
                        <span className="font-bold text-[var(--text-muted)]">{item.symbol}</span>
                        <span className={item.up ? "text-[var(--color-success-text)]" : "text-[var(--color-danger-text)]"}>
                            {item.change}
                        </span>
                    </div>
                ))}
            </div>

            {/* Right: Actions */}
            <div className="flex flex-row items-center gap-4">
                <button
                    onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                    className="flex flex-row items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-white px-2 py-1.5 rounded-md hover:bg-[var(--bg-subtle)] transition-colors"
                    title={language === 'en' ? 'Switch to Chinese' : 'Switch to English'}
                >
                    <Globe className="w-3.5 h-3.5" />
                    {language === 'en' ? 'CN' : 'EN'}
                </button>

                {user ? (
                    <button
                        onClick={handleLogout}
                        title={t('logout')}
                        className="flex flex-row items-center gap-2 text-xs font-medium text-[var(--text-secondary)] hover:text-white px-2 py-1.5 rounded-md hover:bg-[var(--bg-subtle)] transition-colors"
                    >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                            {user.email?.[0].toUpperCase() || 'U'}
                        </div>
                    </button>
                ) : (
                    <Link
                        href="/login"
                        title={t('login')}
                        className="flex flex-row items-center gap-2 text-xs font-medium bg-[var(--text-accent)] text-white px-3 py-1.5 rounded-md hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Login</span>
                    </Link>
                )}
            </div>
        </div>
    );
}
