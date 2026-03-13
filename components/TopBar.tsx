'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';
import { clsx } from 'clsx';
import { LayoutDashboard, Briefcase, LineChart, Bell, Settings, ChevronDown, Zap, Globe, LogOut, Menu, X, FlaskConical } from 'lucide-react';

// Defined outside TopBar so it's never re-created on TopBar re-renders
function NavItem({
    href,
    icon: Icon,
    label,
    active,
    pending,
    onClick,
}: {
    href: string;
    icon: any;
    label: string;
    active: boolean;
    pending: boolean;
    onClick: () => void;
}) {
    const isHighlighted = active || pending;
    return (
        <Link
            href={href}
            onClick={onClick}
            className={clsx(
                "flex flex-row items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150",
                isHighlighted
                    ? "bg-[var(--bg-hover)] text-[var(--text-accent)] border border-[var(--border-active)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            )}
        >
            <Icon className={clsx("w-4 h-4", isHighlighted ? "stroke-[2.5]" : "text-[var(--text-muted)]")} />
            <span>{label}</span>
        </Link>
    );
}

export default function TopBar() {
    const { t, language, setLanguage } = useLanguage();
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    // Track the tab the user just clicked for immediate visual feedback
    // before the route actually changes
    const [pendingPath, setPendingPath] = useState<string | null>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // Model Settings Dialog State (Admin only)
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const [settingsProvider, setSettingsProvider] = useState<'google' | 'deepseek'>('google');
    const [settingsModel, setSettingsModel] = useState<'gemini-3-pro-preview' | 'deepseek-reasoner'>('gemini-3-pro-preview');
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const menuRef = React.useRef<HTMLDivElement>(null);

    // Fetch global settings on mount if admin
    useEffect(() => {
        if (user?.isAdmin) {
            fetch('/api/settings')
                .then(res => res.json())
                .then(data => {
                    if (data?.provider) setSettingsProvider(data.provider);
                    if (data?.model) setSettingsModel(data.model);
                })
                .catch(err => console.error("Failed to load global model settings", err));
        }
    }, [user?.isAdmin]);

    const saveSettings = async () => {
        setIsSavingSettings(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: settingsProvider, model: settingsModel })
            });
            if (res.ok) {
                setShowSettingsDialog(false);
                alert('全局大模型设置已成功保存！');
            } else {
                const err = await res.json();
                alert(`保存失败: ${err.error}`);
            }
        } catch (e) {
            console.error(e);
            alert('保存失败，请检查网络。');
        } finally {
            setIsSavingSettings(false);
        }
    };

    // Clear pending state once route has settled
    useEffect(() => {
        setPendingPath(null);
        setShowMobileMenu(false);
    }, [pathname]);

    // Prefetch all nav routes on mount so navigation is instant
    useEffect(() => {
        router.prefetch('/dashboard');
        router.prefetch('/dashboard/news');
        router.prefetch('/analysis');
        router.prefetch('/sandbox');
    }, [router]);

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

    const handleLogout = () => {
        setShowUserMenu(false);
        logout();
    };

    const makeClickHandler = useCallback((href: string) => () => {
        setPendingPath(href);
    }, []);

    const isActive = (href: string) =>
        pathname === href || (href === '/analysis' && pathname.startsWith('/analysis')) || (href === '/sandbox' && pathname.startsWith('/sandbox'));

    return (
        <>
            <div className="h-[72px] border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] flex flex-row items-center justify-between px-4 md:px-6 sticky top-0 z-50">
                {/* Left: Logo */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href="/dashboard" className="flex items-center gap-3 active:scale-95 transition-transform group">
                        <div className="w-10 h-10 bg-[var(--text-accent)] rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
                            <Zap className="w-5 h-5 text-[#0B0D11] fill-[#0B0D11]" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                            AlphaLens
                        </span>
                    </Link>
                </div>

                {/* Center: Navigation Pills (desktop only) */}
                <nav className="hidden md:flex flex-row items-center gap-2 bg-[var(--bg-subtle)] p-1 rounded-full border border-[var(--border-subtle)]">
                    <NavItem
                        href="/dashboard"
                        icon={LayoutDashboard}
                        label={t('dashboard')}
                        active={isActive('/dashboard')}
                        pending={pendingPath === '/dashboard'}
                        onClick={makeClickHandler('/dashboard')}
                    />
                    <NavItem
                        href="/dashboard/news"
                        icon={Globe}
                        label={t('news')}
                        active={isActive('/dashboard/news')}
                        pending={pendingPath === '/dashboard/news'}
                        onClick={makeClickHandler('/dashboard/news')}
                    />
                    <NavItem
                        href="/analysis"
                        icon={Briefcase}
                        label={t('analytics')}
                        active={isActive('/analysis')}
                        pending={pendingPath === '/analysis'}
                        onClick={makeClickHandler('/analysis')}
                    />
                    <NavItem
                        href="/sandbox"
                        icon={FlaskConical}
                        label={t('sandbox')}
                        active={isActive('/sandbox')}
                        pending={pendingPath === '/sandbox'}
                        onClick={makeClickHandler('/sandbox')}
                    />
                </nav>

                {/* Right: Actions */}
                <div className="flex flex-row items-center gap-1 md:gap-3 flex-shrink-0">

                    {/* Market Status Pill (desktop only) */}
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-subtle)] rounded-full border border-[var(--border-subtle)]">
                        <LineChart className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-sm font-mono font-medium text-[var(--text-secondary)] whitespace-nowrap">
                            {language === 'en' ? 'MARKET: OPEN' : '市场：开盘'}
                        </span>
                        <div className="w-2 h-2 rounded-full bg-[var(--color-success-text)] animate-pulse ml-1"></div>
                    </div>

                    <div className="hidden md:block h-6 w-px bg-[var(--border-subtle)] mx-1"></div>

                    {/* Language toggle */}
                    <button
                        onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                        className="p-2 rounded-full hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] transition-colors flex items-center justify-center font-bold text-xs font-mono"
                        title={language === 'en' ? 'Switch to Chinese' : 'Switch to English'}
                    >
                        {language === 'en' ? 'CN' : 'EN'}
                    </button>

                    {/* Bell (hidden on mobile) */}
                    <button className="hidden sm:flex p-2 rounded-full hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] transition-colors relative">
                        <Bell className="w-5 h-5" />
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--color-danger-text)] border-2 border-[var(--bg-panel)]"></div>
                    </button>

                    {/* User Profile */}
                    {user ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowUserMenu(prev => !prev)}
                                className="flex items-center gap-2 ml-1 md:ml-2 pl-2 md:pl-3 border-l border-[var(--border-subtle)] hover:opacity-80 transition-opacity focus:outline-none"
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
                                        {/* Admin Settings Button */}
                                        {user?.isAdmin && (
                                            <button
                                                onClick={() => { setShowUserMenu(false); setShowSettingsDialog(true); }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] font-medium transition-colors flex items-center gap-2.5 cursor-pointer"
                                            >
                                                <Settings className="w-4 h-4" />
                                                模型设置
                                            </button>
                                        )}
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
                        <div className="flex items-center gap-2 md:gap-3 ml-1 md:ml-2 border-l border-[var(--border-subtle)] pl-2 md:pl-4">
                            <Link href="/login" className="hidden sm:block text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                Log in
                            </Link>
                            <Link
                                href="/register"
                                className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg bg-[var(--text-accent)] text-[#0B0D11] text-sm font-bold hover:opacity-90 transition-opacity shadow-sm shadow-cyan-500/20"
                            >
                                <span>Sign up</span>
                            </Link>
                        </div>
                    )}

                    {/* Hamburger button (mobile only) */}
                    <button
                        onClick={() => setShowMobileMenu(prev => !prev)}
                        className="flex md:hidden ml-1 p-2 rounded-full hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] transition-colors"
                        aria-label="Toggle navigation menu"
                    >
                        {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile navigation drawer */}
            {showMobileMenu && (
                <div className="md:hidden fixed top-[72px] left-0 right-0 bottom-0 z-40 bg-[var(--bg-app)]/95 backdrop-blur-sm">
                    <nav className="flex flex-col p-4 gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)]">
                        <Link
                            href="/dashboard"
                            onClick={() => { makeClickHandler('/dashboard')(); setShowMobileMenu(false); }}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all",
                                isActive('/dashboard')
                                    ? "bg-[var(--bg-hover)] text-[var(--text-accent)] border border-[var(--border-active)]"
                                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            {t('dashboard')}
                        </Link>
                        <Link
                            href="/dashboard/news"
                            onClick={() => { makeClickHandler('/dashboard/news')(); setShowMobileMenu(false); }}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all",
                                isActive('/dashboard/news')
                                    ? "bg-[var(--bg-hover)] text-[var(--text-accent)] border border-[var(--border-active)]"
                                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            <Globe className="w-5 h-5" />
                            {t('news')}
                        </Link>
                        <Link
                            href="/analysis"
                            onClick={() => { makeClickHandler('/analysis')(); setShowMobileMenu(false); }}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all",
                                isActive('/analysis')
                                    ? "bg-[var(--bg-hover)] text-[var(--text-accent)] border border-[var(--border-active)]"
                                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            <Briefcase className="w-5 h-5" />
                            {t('analytics')}
                        </Link>
                        <Link
                            href="/sandbox"
                            onClick={() => { makeClickHandler('/sandbox')(); setShowMobileMenu(false); }}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all",
                                isActive('/sandbox')
                                    ? "bg-[var(--bg-hover)] text-[var(--text-accent)] border border-[var(--border-active)]"
                                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            <FlaskConical className="w-5 h-5" />
                            {t('sandbox')}
                        </Link>

                        {/* Extra actions in drawer */}
                        <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] flex items-center gap-2 px-2">
                            <Bell className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-sm text-[var(--text-secondary)]">{language === 'en' ? 'Notifications' : '通知'}</span>
                        </div>
                    </nav>
                </div>
            )}

            {/* Admin Settings Dialog */}
            {showSettingsDialog && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-blue-500" />
                                全局大模型设置
                            </h2>
                            <button onClick={() => setShowSettingsDialog(false)} className="p-1.5 rounded-full hover:bg-slate-200/50 text-slate-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 flex-1 text-slate-700">
                            <p className="text-sm text-slate-500 mb-5">
                                选择全站默认使用的大语言模型。此设置生效后，所有用户的分析请求都将路由至该模型。
                            </p>

                            <div className="space-y-4">
                                <label className="flex items-start gap-3 p-4 border rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all select-none has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:checked]:ring-1 has-[:checked]:ring-blue-500">
                                    <div className="pt-0.5">
                                        <input
                                            type="radio"
                                            name="model-provider"
                                            value="google"
                                            checked={settingsProvider === 'google'}
                                            onChange={() => {
                                                setSettingsProvider('google');
                                                setSettingsModel('gemini-3-pro-preview');
                                            }}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 flex items-center gap-2">
                                            Google Gemini
                                            {settingsProvider === 'google' && <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">当前选中</span>}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            gemini-3-pro-preview<br />
                                            价格昂贵但稳定性强，适合核心业务流。
                                        </div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-4 border rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all select-none has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:checked]:ring-1 has-[:checked]:ring-blue-500">
                                    <div className="pt-0.5">
                                        <input
                                            type="radio"
                                            name="model-provider"
                                            value="deepseek"
                                            checked={settingsProvider === 'deepseek'}
                                            onChange={() => {
                                                setSettingsProvider('deepseek');
                                                setSettingsModel('deepseek-reasoner');
                                            }}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 flex items-center gap-2">
                                            DeepSeek R1
                                            {settingsProvider === 'deepseek' && <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">当前选中</span>}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            deepseek-reasoner<br />
                                            国产开源推理大模型之光，性价比极高。
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                        <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowSettingsDialog(false)}
                                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={saveSettings}
                                disabled={isSavingSettings}
                                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSavingSettings ? '保存中...' : '保存更改'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
