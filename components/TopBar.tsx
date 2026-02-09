'use client';

import React from 'react';

// Use strict fallback to avoid hydration errors or complex API calls here for now
const INDICES = [
    { symbol: 'S&P 500', value: '5,011.52', change: '+1.2%', up: true },
    { symbol: 'NASDAQ', value: '15,992.40', change: '+1.8%', up: true },
    { symbol: 'DOW', value: '38,773.12', change: '-0.2%', up: false },
    { symbol: 'GOLD', value: '2,024.10', change: '+0.5%', up: true },
    { symbol: 'BTC', value: '51,200.00', change: '+3.4%', up: true },
];

export default function TopBar() {
    return (
        <div className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-app)] flex items-center justify-between px-6 sticky top-0 z-40">
            {/* Left: Section Title */}
            <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">Dashboard</h1>
                <span className="text-[var(--text-secondary)]">/</span>
                <span className="text-sm font-medium text-[var(--text-secondary)]">Global Overview</span>
            </div>

            {/* Center: Mini Ticker (Static/Marquee) */}
            <div className="hidden md:flex items-center gap-6 overflow-hidden">
                {INDICES.map((item) => (
                    <div key={item.symbol} className="flex items-center gap-2 text-xs font-mono">
                        <span className="font-bold text-[var(--text-muted)]">{item.symbol}</span>
                        <span className={item.up ? "text-[var(--color-success-text)]" : "text-[var(--color-danger-text)]"}>
                            {item.value} ({item.change})
                        </span>
                    </div>
                ))}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                <button className="text-xs font-medium bg-[var(--text-accent)] text-white px-3 py-1.5 rounded hover:bg-blue-600 transition-colors">
                    + New Order
                </button>
            </div>
        </div>
    );
}
