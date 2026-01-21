'use client';

import { useState } from 'react';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function TransactionModal({ isOpen, onClose, onSuccess }: TransactionModalProps) {
    const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
    const [symbol, setSymbol] = useState('');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: symbol.toUpperCase(),
                    type,
                    quantity: Number(quantity),
                    price: Number(price),
                    date,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save transaction');

            onSuccess();
            onClose();
            // Reset form
            setSymbol('');
            setQuantity('');
            setPrice('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="glass animate-fade-in" style={{ padding: '2rem', width: '100%', maxWidth: '400px', borderRadius: '12px', position: 'relative' }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}
                >
                    &times;
                </button>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Add Transaction</h2>

                {error && (
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(218, 54, 51, 0.1)', color: 'var(--color-danger-text)', borderRadius: '6px', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <button
                            type="button"
                            className={`btn ${type === 'BUY' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ flex: 1, backgroundColor: type === 'BUY' ? 'var(--color-success)' : undefined, borderColor: type === 'BUY' ? 'transparent' : undefined }}
                            onClick={() => setType('BUY')}
                        >
                            Buy
                        </button>
                        <button
                            type="button"
                            className={`btn ${type === 'SELL' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ flex: 1, backgroundColor: type === 'SELL' ? 'var(--color-danger)' : undefined, borderColor: type === 'SELL' ? 'transparent' : undefined }}
                            onClick={() => setType('SELL')}
                        >
                            Sell
                        </button>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="block text-sm font-medium mb-1">Stock Symbol</label>
                        <input
                            type="text"
                            className="input-field"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            placeholder="e.g. AAPL"
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label className="block text-sm font-medium mb-1">Quantity</label>
                            <input
                                type="number"
                                className="input-field"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="0"
                                min="0.0001"
                                step="any"
                                required
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="block text-sm font-medium mb-1">Price per Share</label>
                            <input
                                type="number"
                                className="input-field"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="any"
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <input
                            type="date"
                            className="input-field"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Transaction'}
                    </button>
                </form>
            </div>
        </div>
    );
}
