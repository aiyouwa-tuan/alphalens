'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';
import { supabase } from '@/lib/supabase';
import { clsx } from 'clsx';
import { LayoutDashboard, Briefcase, LineChart, Bell, Settings, ChevronDown, Zap, Globe, LogOut } from 'lucide-react';

export default function TopBar() {
    const { t, language, setLanguage } = useLanguage();
    const pathname = usePathname();

    // Auth State
    const [user, setUser] = useState<any>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!supabase) return;
        const client = supabase;
        const checkUser = async () => {
            const { data: { session } } = await client.auth.getSession();
            setUser(session?.user || null);
        };
        checkUser();

        const { data: { subscription } } = client.auth.onAuthStateChange((_event: any, session: any) => {
            setUser(session?.user || null);
        });
        return () => subscription.unsubscribe();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!showUserMenu) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showUserMenu]);

    const handleLogout = useCallback(async () => {
        setShowUserMenu(false);
        try {
            if (supabase) {
                const client = supabase;
                await client.auth.signOut();
            }
            await fetch('/api/auth/logout', { method: 'POST' }).catch(() => { });
        } catch (e) {
            console.error("Logout error:", e);
        }
        window.location.reload();
    }, []);

    const NavItem = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
        const active = pathname === href || (href === '/analysis' && pathname.startsWith('/analysis'));
        return (
            <Link href={href} className={clsx(
                "flex flex-row items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200",
                active
                    ? "bg-[var(--bg-hover)] text-[var(--text-accent)] border border-[var(--border-active)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            )}>
                <Icon className={clsx("w-4 h-4", active ? "stroke-[2.5]" : "text-[var(--text-muted)]")} />
                <span>{label}</span>
            </Link>
        );
    };

    return (
        <div className="h-[72px] border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] flex flex-row items-center justify-between px-6 sticky top-0 z-50">
            {/* Left: Logo */}
            <div className="flex items-center gap-2 min-w-[200px]">
                <Link href="/dashboard" className="flex items-center gap-3 active:scale-95 transition-transform group">
                    <div className="w-10 h-10 bg-[var(--text-accent)] rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
                        <Zap className="w-5 h-5 text-[#0B0D11] fill-[#0B0D11]" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                        AlphaLens
                    </span>
                </Link>
            </div>

            {/* Center: Navigation Pills */}
            <nav className="hidden md:flex flex-row items-center gap-2 bg-[var(--bg-subtle)] p-1 rounded-full border border-[var(--border-subtle)]">
                <NavItem href="/dashboard" icon={LayoutDashboard} label={t('dashboard')} />
                <NavItem href="/dashboard/news" icon={Globe} label={t('news')} />
                <NavItem href="/analysis" icon={Briefcase} label={t('analytics')} />
            </nav>

            {/* Right: Actions */}
            <div className="flex flex-row items-center gap-3 min-w-[200px] justify-end">

                {/* Market Status Pill */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-subtle)] rounded-full border border-[var(--border-subtle)]">
                    <LineChart className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="text-sm font-mono font-medium text-[var(--text-secondary)] whitespace-nowrap">
                        {language === 'en' ? 'MARKET: OPEN' : '市场：开盘'}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-[var(--color-success-text)] animate-pulse ml-1"></div>
                </div>

                <div className="h-6 w-px bg-[var(--border-subtle)] mx-2"></div>

                {/* Icons */}
                <button
                    onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                    className="p-2 rounded-full hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] transition-colors flex items-center justify-center font-bold text-xs font-mono"
                    title={language === 'en' ? 'Switch to Chinese' : 'Switch to English'}
                >
                    {language === 'en' ? 'CN' : 'EN'}
                </button>

                <button className="p-2 rounded-full hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--color-danger-text)] border-2 border-[var(--bg-panel)]"></div>
                </button>

                <button className="p-2 rounded-full hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] transition-colors">
                    <Settings className="w-5 h-5" />
                </button>

                {/* User Profile */}
                {user ? (
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowUserMenu(prev => !prev)}
                            className="flex items-center gap-2 ml-2 pl-3 border-l border-[var(--border-subtle)] hover:opacity-80 transition-opacity focus:outline-none"
                        >
                            <div className="w-8 h-8 rounded-full bg-[var(--text-accent)] flex items-center justify-center text-xs font-bold text-[#0B0D11] shadow-sm shadow-cyan-500/20">
                                {user.email ? user.email.substring(0, 2).toUpperCase() : 'U'}
                            </div>
                            <div className="hidden sm:flex items-center gap-1">
                                <span className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-[120px]">{user.email || 'User'}</span>
                                <ChevronDown className={clsx("w-4 h-4 text-[var(--text-muted)] transition-transform", showUserMenu && "rotate-180")} />
                            </div>
                        </button>

                        {showUserMenu && (
                            <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--bg-panel)] rounded-xl shadow-2xl border border-[var(--border-subtle)] py-1 z-[9999]">
                                <div className="px-4 py-2.5 border-b border-[var(--border-subtle)]">
                                    <p className="text-xs text-[var(--text-muted)] font-medium font-mono uppercase tracking-wider">当前账号</p>
                                    <p className="text-sm text-[var(--text-primary)] font-medium truncate mt-0.5">{user.email}</p>
                                </div>
                                <div className="py-1">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-danger-text)] hover:bg-[var(--bg-subtle)] font-medium transition-colors flex items-center gap-2.5 cursor-pointer"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        退出登录
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-3 ml-2 border-l border-[var(--border-subtle)] pl-4">
                        <Link href="/login" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                            Log in
                        </Link>
                        <Link
                            href="/login"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--text-accent)] text-[#0B0D11] text-sm font-bold hover:opacity-90 transition-opacity shadow-sm shadow-cyan-500/20"
                        >
                            <span>Sign up</span>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
