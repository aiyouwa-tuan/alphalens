'use client';

import { useEffect, useState } from 'react';

interface MacroQuote {
    symbol: string;
    shortName: string;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
}

export default function MacroWidget() {
    const [data, setData] = useState<MacroQuote[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/market/macro')
            .then(res => res.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="h-full flex items-center justify-center text-[var(--text-muted)]">Loading Macro...</div>;

    return (
        <div className="flex flex-col h-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 tracking-wider">MACRO INDICATORS</h3>
            <div className="grid grid-cols-2 gap-4">
                {data.map((item) => (
                    <div key={item.symbol} className="flex flex-col">
                        <span className="text-xs text-[var(--text-muted)] truncate" title={item.shortName}>{item.shortName}</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-white">
                                {item.regularMarketPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className={`text-xs ${item.regularMarketChangePercent >= 0 ? 'text-[var(--color-success-text)]' : 'text-[var(--color-danger-text)]'}`}>
                                {item.regularMarketChangePercent >= 0 ? '+' : ''}{item.regularMarketChangePercent?.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
