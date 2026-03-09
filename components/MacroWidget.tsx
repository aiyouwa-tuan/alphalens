'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import { TrendingUp, TrendingDown, Activity, DollarSign, Droplets, Shield, BarChart3 } from 'lucide-react';

interface MacroQuote {
    symbol: string;
    shortName: string;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
}

const ICON_MAP: Record<string, any> = {
    '^TNX': Shield,
    '^VIX': Activity,
    'GC=F': DollarSign,
    'CL=F': Droplets,
    'DX-Y.NYB': BarChart3,
};

const COLOR_MAP: Record<string, string> = {
    '^TNX': 'bg-blue-500/10 text-blue-400',
    '^VIX': 'bg-orange-500/10 text-orange-400',
    'GC=F': 'bg-amber-500/10 text-amber-400',
    'CL=F': 'bg-emerald-500/10 text-emerald-400',
    'DX-Y.NYB': 'bg-purple-500/10 text-purple-400',
};

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
        <div className="w-full h-full bg-[var(--bg-panel)] rounded-[20px] border border-[var(--border-subtle)] p-5 flex items-center justify-center">
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm font-mono">
                <div className="w-4 h-4 border-2 border-[var(--text-muted)] border-t-transparent rounded-full animate-spin"></div>
                LOADING...
            </div>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-[20px] overflow-hidden">
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-[var(--text-muted)] tracking-wider uppercase">{t('macroIndicators')}</h3>
                <span className="text-[10px] font-mono text-[var(--color-success-text)] bg-[var(--color-success-text)]/10 px-2 py-0.5 rounded-full">LIVE</span>
            </div>

            <div className="flex-1 flex flex-col px-4 pb-4">
                {data.map((item, index) => {
                    const IconComponent = ICON_MAP[item.symbol] || BarChart3;
                    const colorClass = COLOR_MAP[item.symbol] || 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]';
                    const isPositive = item.regularMarketChangePercent >= 0;
                    const displayName = t(item.symbol as any) !== item.symbol ? t(item.symbol as any) : item.shortName;

                    return (
                        <div key={item.symbol}>
                            <div className="flex items-center gap-3 py-2.5 px-1">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                    <IconComponent className="w-4 h-4" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <span className="text-xs text-[var(--text-secondary)] font-medium truncate block" title={item.shortName}>
                                        {displayName}
                                    </span>
                                </div>

                                <div className="flex flex-col items-end flex-shrink-0">
                                    <span className="text-sm font-bold font-mono text-[var(--text-primary)] tabular-nums">
                                        {item.regularMarketPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <div className={`flex items-center gap-0.5 ${isPositive ? 'text-[var(--color-success-text)]' : 'text-[var(--color-danger-text)]'}`}>
                                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        <span className="text-[11px] font-mono font-semibold tabular-nums">
                                            {isPositive ? '+' : ''}{item.regularMarketChangePercent?.toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {index < data.length - 1 && (
                                <div className="h-px bg-[var(--border-subtle)] mx-1"></div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
