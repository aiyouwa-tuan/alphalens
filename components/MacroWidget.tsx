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
    '^TNX': Shield,        // 10Y Treasury
    '^VIX': Activity,      // VIX
    'GC=F': DollarSign,    // Gold
    'CL=F': Droplets,      // Oil
    'DX-Y.NYB': BarChart3, // Dollar Index
};

const COLOR_MAP: Record<string, string> = {
    '^TNX': 'bg-blue-50 text-blue-600',
    '^VIX': 'bg-orange-50 text-orange-600',
    'GC=F': 'bg-amber-50 text-amber-600',
    'CL=F': 'bg-emerald-50 text-emerald-600',
    'DX-Y.NYB': 'bg-purple-50 text-purple-600',
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
        <div className="w-full h-full bg-white rounded-[20px] border border-slate-200 p-5 shadow-sm flex items-center justify-center">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                加载中...
            </div>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase">{t('macroIndicators')}</h3>
                <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">实时</span>
            </div>

            {/* Items */}
            <div className="flex-1 flex flex-col px-4 pb-4">
                {data.map((item, index) => {
                    const IconComponent = ICON_MAP[item.symbol] || BarChart3;
                    const colorClass = COLOR_MAP[item.symbol] || 'bg-slate-50 text-slate-600';
                    const isPositive = item.regularMarketChangePercent >= 0;
                    const displayName = t(item.symbol as any) !== item.symbol ? t(item.symbol as any) : item.shortName;

                    return (
                        <div key={item.symbol}>
                            <div className="flex items-center gap-3 py-2.5 px-1">
                                {/* Icon */}
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                    <IconComponent className="w-4 h-4" />
                                </div>

                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs text-slate-500 font-medium truncate block" title={item.shortName}>
                                        {displayName}
                                    </span>
                                </div>

                                {/* Value + Change */}
                                <div className="flex flex-col items-end flex-shrink-0">
                                    <span className="text-sm font-bold text-slate-900 tabular-nums">
                                        {item.regularMarketPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <div className={`flex items-center gap-0.5 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        <span className="text-[11px] font-semibold tabular-nums">
                                            {isPositive ? '+' : ''}{item.regularMarketChangePercent?.toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {/* Divider (except last) */}
                            {index < data.length - 1 && (
                                <div className="h-px bg-slate-100 mx-1"></div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

