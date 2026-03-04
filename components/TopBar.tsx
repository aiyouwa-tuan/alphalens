'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useLanguage } from '@/components/LanguageProvider';
import { clsx } from 'clsx';
import { LayoutDashboard, Briefcase, Star, LineChart, Bell, Settings, ChevronDown, Zap, Globe } from 'lucide-react';

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

    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = async () => {
        if (supabase) await supabase.auth.signOut();
        // Clear server-side cookie
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        setShowUserMenu(false);
        router.refresh(); // Stays on current page but refreshes SSR state
    };

    const NavItem = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
        const active = pathname === href || (href === '/analysis' && pathname.startsWith('/analysis'));
        return (
            <Link href={href} className={clsx(
                "flex flex-row items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200",
                active
                    ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}>
                <Icon className={clsx("w-4 h-4", active ? "text-blue-600 stroke-[2.5]" : "text-slate-400")} />
                <span>{label}</span>
            </Link>
        );
    };

    return (
        <div className="h-[72px] border-b border-slate-200 bg-white flex flex-row items-center justify-between px-6 sticky top-0 z-50">
            {/* Left: Logo */}
            <div className="flex items-center gap-2 min-w-[200px]">
                <Link href="/dashboard" className="flex items-center gap-3 active:scale-95 transition-transform group">
                    <div className="w-10 h-10 bg-[var(--text-accent)] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
                        <Zap className="w-5 h-5 text-accent fill-white" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] tracking-tight">
                        AlphaLens
                    </span>
                </Link>
            </div>

            {/* Center: Navigation Pills */}
            <nav className="hidden md:flex flex-row items-center gap-2 bg-slate-50/50 p-1 rounded-full border border-slate-100">
                <NavItem href="/dashboard" icon={LayoutDashboard} label={t('dashboard')} />
                <NavItem href="/dashboard/news" icon={Globe} label={t('news')} />
                <NavItem href="/analysis" icon={Briefcase} label={t('analytics')} />
            </nav>

            {/* Right: Actions */}
            <div className="flex flex-row items-center gap-3 min-w-[200px] justify-end">

                {/* Market Status Pill */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200/60 shadow-sm">
                    <LineChart className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600 whitespace-nowrap">{language === 'en' ? 'Market: Open' : '市场：开盘'}</span>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ml-1 opacity-90"></div>
                </div>

                <div className="h-6 w-px bg-slate-200 mx-2"></div>

                {/* Icons */}
                <button
                    onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors flex items-center justify-center font-bold text-xs"
                    title={language === 'en' ? 'Switch to Chinese' : 'Switch to English'}
                >
                    {language === 'en' ? 'CN' : 'EN'}
                </button>

                <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></div>
                </button>
                <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                    <Settings className="w-5 h-5" />
                </button>

                {/* User Profile */}
                {user ? (
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-200 hover:opacity-80 transition-opacity focus:outline-none"
                        >
                            <div className="w-8 h-8 rounded-full bg-[#0066FF] flex items-center justify-center text-xs font-bold text-white shadow-sm">
                                {user.email ? user.email.substring(0, 2).toUpperCase() : 'US'}
                            </div>
                            <div className="hidden sm:flex items-center gap-1">
                                <span className="text-sm font-semibold text-slate-700 truncate max-w-[100px]">{user.email || 'User'}</span>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </div>
                        </button>

                        {/* Dropdown Menu */}
                        {showUserMenu && (
                            <>
                                {/* Invisible Backdrop to capture clicks outside */}
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowUserMenu(false)}
                                ></div>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-2">
                                    <div className="px-4 py-2 border-b border-slate-50">
                                        <p className="text-xs text-slate-500 font-medium truncate">{user.email}</p>
                                    </div>
                                    <button
                                        onMouseDown={(e) => {
                                            e.preventDefault(); // Prevents focus loss issues
                                            handleLogout();
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 font-medium transition-colors flex items-center gap-2 relative z-50 cursor-pointer"
                                    >
                                        Log Out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-3 ml-2 border-l border-slate-200 pl-4">
                        <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
                            Log in
                        </Link>
                        <Link
                            href="/login"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0066FF] text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <span>Sign up</span>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
