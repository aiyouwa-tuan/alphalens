'use client';

import React, { useEffect, useState } from 'react';

// Dynamic Indices Fetching
// Replaces hardcoded values (which were causing "Old Data" complaints)
// Now fetches from /api/market-overview which uses our proxy logic (SPY*10, etc.)

interface MarketItem {
    symbol: string;
    value: string;
    change: string;
    up: boolean;
}

export default function TopBar() {
    const [indices, setIndices] = useState<MarketItem[]>([
        // Initial state can be empty or skeletons.
        // Or keep the old values as "Loading..." placeholders? No, checking "Loading..." is better.
    ]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/market-overview');
                if (!res.ok) throw new Error('Failed');
                const data = await res.json();

                // Map API data to TopBar format
                // API keys: indices.us (Array), commodities (Array)

                const formatItem = (name: string, item: any) => {
                    if (!item) return null;
                    const change = item.changePercent || 0;
                    return {
                        symbol: name,
                        value: (item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                        change: (change > 0 ? '+' : '') + change.toFixed(1) + '%',
                        up: change >= 0
                    };
                };

                const spx = data.indices?.us?.find((x: any) => x.symbol === '^GSPC');
                const ndx = data.indices?.us?.find((x: any) => x.symbol === '^IXIC');
                const dji = data.indices?.us?.find((x: any) => x.symbol === '^DJI');
                const gold = data.commodities?.find((x: any) => x.symbol === 'Gold');
                const btc = data.commodities?.find((x: any) => x.symbol === 'BTC');

                const newIndices = [
                    formatItem('S&P 500', spx),
                    formatItem('NASDAQ', ndx),
                    formatItem('DOW', dji),
                    formatItem('GOLD', gold),
                    formatItem('BTC', btc)
                ].filter(Boolean) as MarketItem[];

                setIndices(newIndices);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
        // Poll every 30s
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-app)] flex items-center justify-between px-6 sticky top-0 z-40">
            {/* Left: Section Title */}
            <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">Dashboard</h1>
                <span className="text-[var(--text-secondary)]">/</span>
                <span className="text-sm font-medium text-[var(--text-secondary)]">Global Overview</span>
            </div>

            {/* Center: Mini Ticker (Dynamic) */}
            <div className="hidden md:flex items-center gap-6 overflow-hidden">
                {loading ? (
                    <span className="text-xs text-[var(--text-muted)]">Loading market data...</span>
                ) : (
                    indices.map((item) => (
                        <div key={item.symbol} className="flex items-center gap-2 text-xs font-mono">
                            <span className="font-bold text-[var(--text-muted)]">{item.symbol}</span>
                            <span className={item.up ? "text-[var(--color-success-text)]" : "text-[var(--color-danger-text)]"}>
                                {item.value} ({item.change})
                            </span>
                        </div>
                    ))
                )}
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
