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
        <div className="w-full h-full bg-white rounded-[20px] border border-slate-200 p-4 shadow-sm flex items-center justify-center text-slate-400 text-sm font-medium">
            {t('loadingCrypto')}
        </div>
    );

    return (
        <div className="w-full flex flex-col h-full bg-white border border-slate-200 rounded-[20px] p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-4">{t('cryptoAssets')}</h3>
            <div className="flex flex-col gap-3">
                {data.map((coin) => (
                    <div key={coin.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-[10px] font-extrabold text-amber-600 uppercase">
                                {coin.symbol.slice(0, 2)}
                            </div>
                            <div>
                                <div className="font-bold text-slate-800 uppercase text-sm">{coin.symbol}</div>
                                <div className="text-[10px] text-slate-400">{coin.name}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900 font-mono">${coin.current_price.toLocaleString()}</div>
                            <div className={`text-xs font-semibold ${coin.price_change_percentage_24h >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {coin.price_change_percentage_24h >= 0 ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
