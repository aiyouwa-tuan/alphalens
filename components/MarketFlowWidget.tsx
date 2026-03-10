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
            <div className="h-[200px] bg-[var(--bg-panel)] rounded-[20px] animate-pulse border border-[var(--border-subtle)] p-4">
                <div className="h-4 bg-[var(--bg-subtle)] w-1/3 mb-4 rounded"></div>
                <div className="space-y-3">
                    <div className="h-8 bg-[var(--bg-subtle)] rounded"></div>
                    <div className="h-8 bg-[var(--bg-subtle)] rounded"></div>
                    <div className="h-8 bg-[var(--bg-subtle)] rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-[var(--bg-panel)] rounded-[20px] border border-[var(--border-subtle)] flex flex-col h-full">
            <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex justify-between items-center">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">{title}</h3>
                <span className="text-[10px] font-mono text-[var(--text-accent)]">{t('realTime')}</span>
            </div>

            <div className="flex-1">
                <table className="w-full text-sm">
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.symbol} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-subtle)] transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="font-bold font-mono text-[var(--text-accent)]">
                                            {t(item.symbol as any) !== item.symbol ? t(item.symbol as any) : item.symbol}
                                        </span>
                                        <span className="text-[10px] text-[var(--text-muted)]">{item.name}</span>
                                    </div>
                                </td>

                                <td className="w-24 h-12 px-2 hidden sm:table-cell">
                                    {item.history && item.history.length > 1 ? (
                                        <div className="h-full w-full py-2">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={item.history.map((val, i) => ({ i, val }))}>
                                                    <Line
                                                        type="monotone"
                                                        dataKey="val"
                                                        stroke={item.changePercent >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)"}
                                                        strokeWidth={1.5}
                                                        dot={false}
                                                        isAnimationActive={false}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-[1px] bg-[var(--border-subtle)] w-full opacity-30"></div>
                                    )}
                                </td>

                                <td className="px-4 py-3 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="font-mono font-semibold text-[var(--text-primary)]">
                                            {typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
                                        </span>
                                        <span className={clsx(
                                            "text-xs font-mono font-semibold",
                                            (item.changePercent || 0) >= 0 ? "text-[var(--color-success-text)]" : "text-[var(--color-danger-text)]"
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
                    <div className="p-4 text-center text-[var(--text-muted)] text-xs font-mono">NO DATA</div>
                )}
            </div>
        </div>
    );
}
