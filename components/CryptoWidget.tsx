'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';

interface CryptoData {
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    price_change_percentage_24h: number;
}

export default function CryptoWidget() {
    const { t } = useLanguage();
    const [data, setData] = useState<CryptoData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/market/crypto')
            .then(res => res.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="w-full h-full bg-[var(--bg-panel)] rounded-[20px] border border-[var(--border-subtle)] p-4 flex items-center justify-center text-[var(--text-muted)] text-sm font-mono">
            LOADING...
        </div>
    );

    return (
        <div className="w-full flex flex-col h-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-[20px] p-4">
            <h3 className="text-xs font-mono font-bold text-[var(--text-muted)] tracking-wider uppercase mb-4">{t('cryptoAssets')}</h3>
            <div className="flex flex-col gap-3">
                {data.map((coin) => (
                    <div key={coin.id} className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)] last:border-0">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px] font-extrabold text-amber-400 uppercase font-mono">
                                {coin.symbol.slice(0, 2)}
                            </div>
                            <div>
                                <div className="font-bold text-[var(--text-primary)] uppercase text-sm font-mono">{coin.symbol}</div>
                                <div className="text-[10px] text-[var(--text-muted)]">{coin.name}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-semibold text-[var(--text-primary)] font-mono">${coin.current_price.toLocaleString()}</div>
                            <div className={`text-xs font-mono font-semibold ${coin.price_change_percentage_24h >= 0 ? 'text-[var(--color-success-text)]' : 'text-[var(--color-danger-text)]'}`}>
                                {coin.price_change_percentage_24h >= 0 ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
