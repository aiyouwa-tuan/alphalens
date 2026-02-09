'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageProvider';

interface WatchlistItem {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
}

export default function Watchlist() {
    const { t } = useLanguage();
    const [items, setItems] = useState<WatchlistItem[]>([]);
    const [newSymbol, setNewSymbol] = useState('');
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    const fetchWatchlist = async () => {
        try {
            const res = await fetch('/api/watchlist');
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (error) {
            console.error('Failed to fetch watchlist', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWatchlist();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSymbol) return;

        setAdding(true);
        try {
            await fetch('/api/watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol: newSymbol })
            });
            setNewSymbol('');
            fetchWatchlist();
        } catch (error) {
            console.error('Failed to add symbol', error);
        } finally {
            setAdding(false);
        }
    };

    const handleRemove = async (symbol: string) => {
        try {
            // Optimistic update
            setItems(items.filter(i => i.symbol !== symbol));

            await fetch(`/api/watchlist?symbol=${symbol}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Failed to remove symbol', error);
            fetchWatchlist(); // Revert on error
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    const formatPercent = (val: number) => {
        return val.toFixed(2) + '%';
    };

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-lg p-5 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-wider uppercase">{t('activePositions')}</h3>
                <button className="text-xs text-[var(--text-accent)] hover:text-white transition-colors">{t('manage')}</button>
            </div>

            {/* Input */}
            <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                    placeholder="Symbol"
                    className="flex-1 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--text-accent)]"
                />
                <button
                    type="submit"
                    disabled={adding}
                    className="bg-[var(--bg-subtle)] text-white px-3 py-1.5 rounded hover:bg-[var(--text-accent)] transition-colors text-sm disabled:opacity-50"
                >
                    {adding ? '...' : '+'}
                </button>
            </form>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs text-[var(--text-secondary)] border-b border-[var(--border-subtle)]">
                            <th className="pb-2 font-medium">{t('asset')}</th>
                            <th className="pb-2 font-medium text-right">{t('price')}</th>
                            <th className="pb-2 font-medium text-right">{t('pl')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={3} className="text-center py-4 text-[var(--text-muted)]">Loading...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={3} className="text-center py-4 text-[var(--text-muted)]">Empty</td></tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.symbol} className="group hover:bg-[var(--bg-surface)] transition-colors border-b border-[var(--border-subtle)] last:border-0 text-sm">
                                    <td className="py-3">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white">{item.symbol}</span>
                                            <button
                                                onClick={() => handleRemove(item.symbol)}
                                                className="text-[10px] text-[var(--color-danger-text)] text-left hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </td>
                                    <td className="py-3 text-right font-mono">{formatCurrency(item.price)}</td>
                                    <td className="py-3 text-right font-mono">
                                        <div className={item.changePercent >= 0 ? "text-[var(--color-success-text)]" : "text-[var(--color-danger-text)]"}>
                                            {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
