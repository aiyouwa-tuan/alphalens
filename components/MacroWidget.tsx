'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';

interface MacroQuote {
    symbol: string;
    shortName: string;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
}

export default function MacroWidget() {
    const { t } = useLanguage();
    const [data, setData] = useState<MacroQuote[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/market/macro')
            .then(res => res.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="w-full h-full bg-white rounded-[20px] border border-slate-200 p-5 shadow-sm flex items-center justify-center text-slate-400 text-sm font-medium">
            Loading Macro...
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col justify-between bg-white border border-slate-200 rounded-[20px] p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-4">{t('macroIndicators')}</h3>
            <div className="grid grid-cols-2 gap-4">
                {data.map((item) => (
                    <div key={item.symbol} className="flex flex-col">
                        <span className="text-xs text-slate-400 truncate font-medium" title={item.shortName}>
                            {t(item.symbol as any) !== item.symbol ? t(item.symbol as any) : item.shortName}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-extrabold text-slate-900">
                                {item.regularMarketPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className={`text-xs font-semibold ${item.regularMarketChangePercent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {item.regularMarketChangePercent >= 0 ? '+' : ''}{item.regularMarketChangePercent?.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
