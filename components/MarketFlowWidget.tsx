'use client';

import React from 'react';
import { clsx } from 'clsx';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/components/LanguageProvider';

interface MarketItem {
    symbol: string;
    name: string;
    price: number;
    changePercent: number;
    history?: number[];
}

interface MarketFlowWidgetProps {
    title: string;
    items: MarketItem[];
    isLoading?: boolean;
}

export default function MarketFlowWidget({ title, items, isLoading }: MarketFlowWidgetProps) {
    const { t } = useLanguage();

    if (isLoading) {
        return (
            <div className="h-[200px] bg-white rounded-[20px] animate-pulse border border-slate-200 p-4 shadow-sm">
                <div className="h-4 bg-slate-100 w-1/3 mb-4 rounded"></div>
                <div className="space-y-3">
                    <div className="h-8 bg-slate-100 rounded"></div>
                    <div className="h-8 bg-slate-100 rounded"></div>
                    <div className="h-8 bg-slate-100 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-[20px] border border-slate-200 flex flex-col h-full shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
                <span className="text-[10px] text-slate-400 font-medium">{t('realTime')}</span>
            </div>

            <div className="flex-1">
                <table className="w-full text-sm">
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.symbol} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/30 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800">
                                            {t(item.symbol as any) !== item.symbol ? t(item.symbol as any) : item.symbol}
                                        </span>
                                        <span className="text-[10px] text-slate-400">{item.name}</span>
                                    </div>
                                </td>

                                {/* Sparkline Column */}
                                <td className="w-24 h-12 px-2 hidden sm:table-cell">
                                    {item.history && item.history.length > 1 ? (
                                        <div className="h-full w-full py-2">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={item.history.map((val, i) => ({ i, val }))}>
                                                    <Line
                                                        type="monotone"
                                                        dataKey="val"
                                                        stroke={item.changePercent >= 0 ? "#10B981" : "#EF4444"}
                                                        strokeWidth={1.5}
                                                        dot={false}
                                                        isAnimationActive={false}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-[1px] bg-slate-200 w-full opacity-30"></div>
                                    )}
                                </td>

                                <td className="px-4 py-3 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="font-mono font-semibold text-slate-900">
                                            {typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
                                        </span>
                                        <span className={clsx(
                                            "text-xs font-semibold",
                                            (item.changePercent || 0) >= 0 ? "text-emerald-600" : "text-red-500"
                                        )}>
                                            {(item.changePercent || 0) >= 0 ? '+' : ''}{(item.changePercent || 0).toFixed(2)}%
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!items || items.length === 0) && (
                    <div className="p-4 text-center text-slate-400 text-xs font-medium">{t('noData')}</div>
                )}
            </div>
        </div>
    );
}
