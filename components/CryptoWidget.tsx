'use client';

import { useEffect, useState } from 'react';

interface CryptoData {
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    price_change_percentage_24h: number;
}

export default function CryptoWidget() {
    const [data, setData] = useState<CryptoData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/market/crypto')
            .then(res => res.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="h-full flex items-center justify-center text-[var(--text-muted)]">Loading Crypto...</div>;

    return (
        <div className="flex flex-col h-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 tracking-wider">CRYPTO ASSETS</h3>
            <div className="flex flex-col gap-3">
                {data.map((coin) => (
                    <div key={coin.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {/* Could add icon here if available */}
                            <span className="font-bold text-white uppercase">{coin.symbol}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-white">${coin.current_price.toLocaleString()}</div>
                            <div className={`text-xs ${coin.price_change_percentage_24h >= 0 ? 'text-[var(--color-success-text)]' : 'text-[var(--color-danger-text)]'}`}>
                                {coin.price_change_percentage_24h >= 0 ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
