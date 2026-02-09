'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

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
    )
};

const NavItem = ({ href, Icon, active }: { href: string; Icon: any; active: boolean }) => (
    <Link href={href} className={clsx(
        "w-10 h-10 flex items-center justify-center rounded-lg transition-colors mb-4",
        active ? "bg-[var(--text-accent)] text-white shadow-lg shadow-blue-500/20" : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-white"
    )}>
        <div className="w-5 h-5">
            <Icon />
        </div>
    </Link>
);

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-16 h-screen flex flex-col items-center py-6 bg-[var(--bg-app)] border-r border-[var(--border-subtle)] fixed left-0 top-0 z-50">
            <div className="mb-8">
                <Icons.Logo />
            </div>

            <nav className="flex-1 w-full flex flex-col items-center">
                <NavItem href="/dashboard" Icon={Icons.Dashboard} active={pathname === '/dashboard'} />
                <NavItem href="/dashboard/news" Icon={Icons.News} active={pathname === '/dashboard/news'} />
                <NavItem href="/dashboard/settings" Icon={Icons.Settings} active={pathname === '/dashboard/settings'} />
            </nav>

            <div className="mt-auto">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 border border-white/20 cursor-pointer"></div>
            </div>
        </div>
    );
}
