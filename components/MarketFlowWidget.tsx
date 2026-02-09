'use client';

import React from 'react';
import { clsx } from 'clsx';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface MarketItem {
    symbol: string;
    name: string;
    price: number;
    changePercent: number;
    history?: number[]; // Simple array of numbers for sparkline
}

interface MarketFlowWidgetProps {
    title: string;
    items: MarketItem[];
    isLoading?: boolean;
}

export default function MarketFlowWidget({ title, items, isLoading }: MarketFlowWidgetProps) {
    if (isLoading) {
        return (
            <div className="h-[200px] bg-[var(--bg-panel)] rounded-lg animate-pulse border border-[var(--border-subtle)] p-4">
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
        <div className="bg-[var(--bg-panel)] rounded-lg border border-[var(--border-subtle)] overflow-hidden flex flex-col h-full">
            <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">{title}</h3>
                <span className="text-[10px] text-[var(--text-muted)]">Real-time</span>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.symbol} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-subtle)] transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-[var(--text-primary)]">{item.symbol}</span>
                                        <span className="text-[10px] text-[var(--text-secondary)]">{item.name}</span>
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
                                        <span className="font-mono font-medium">{item.price.toFixed(2)}</span>
                                        <span className={clsx(
                                            "text-xs font-semibold",
                                            item.changePercent >= 0 ? "text-[var(--color-success-text)]" : "text-[var(--color-danger-text)]"
                                        )}>
                                            {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!items || items.length === 0) && (
                    <div className="p-4 text-center text-[var(--text-muted)] text-xs">No data available</div>
                )}
            </div>
        </div>
    );
}
