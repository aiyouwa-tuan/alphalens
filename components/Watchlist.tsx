'use client';

import { useState, useEffect } from 'react';

interface WatchlistItem {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
}

export default function Watchlist() {
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
            // fetchWatchlist(); // Optional, if optimistic is enough
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
        <div className="card">
            <div className="card-header">
                <span className="card-title">Watchlist</span>
            </div>

            {/* Input */}
            <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input
                    type="text"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                    placeholder="Symbol"
                    className="input-field"
                    style={{ flex: 1, padding: '0.5rem' }}
                />
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={adding}
                    style={{ padding: '0.5rem 1rem' }}
                >
                    {adding ? '...' : '+'}
                </button>
            </form>

            {/* List */}
            {loading ? (
                <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
            ) : items.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.875rem' }}>Empty watchlist.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {items.map((item) => (
                        <div key={item.symbol} className="market-item">
                            <div style={{ fontWeight: 600 }}>{item.symbol}</div>

                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div>{formatCurrency(item.price)}</div>
                                    <div style={{ fontSize: '0.75rem', color: (item.changePercent || 0) >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                                        {(item.changePercent || 0) >= 0 ? '+' : ''}{item.change ? formatCurrency(item.change) : '$0.00'}
                                        {' '}
                                        ({(item.changePercent || 0) >= 0 ? '+' : ''}{formatPercent(item.changePercent || 0)})
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemove(item.symbol)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.25rem', opacity: 0.5 }}
                                    title="Remove"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
