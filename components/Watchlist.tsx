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

            const { t } = useLanguage();

            return (
                    ))
        }
                </div >
            )
}
        </div >
    );
}
