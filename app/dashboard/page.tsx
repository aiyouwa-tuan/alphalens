'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TransactionModal from '../components/TransactionModal';
import Watchlist from '@/components/Watchlist';

interface Holding {
    symbol: string;
    quantity: number;
    averageCost: number;
    currentPrice: number;
    changePercent: number;
    marketValue: number;
    unrealizedPL: number;
    unrealizedPLPercent: number;
}

interface PortfolioStats {
    totalEquity: number;
    totalRealizedPL: number;
    totalUnrealizedPL: number;
    totalPL: number;
}

export default function Dashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<PortfolioStats | null>(null);
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [marketData, setMarketData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchPortfolio = async () => {
        try {
            const res = await fetch('/api/portfolio');
            if (res.status === 401) {
                router.push('/login');
                return;
            }
            const data = await res.json();
            if (data.stats) {
                setStats(data.stats);
                setHoldings(data.holdings);
            }
        } catch (error) {
            console.error('Failed to fetch portfolio', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMarketData = async () => {
        try {
            const res = await fetch('/api/market-overview');
            if (res.ok) {
                const data = await res.json();
                setMarketData(data);
            }
        } catch (error) {
            console.error('Failed to fetch market data', error);
        }
    };

    useEffect(() => {
        fetchPortfolio();
        fetchMarketData();
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    const formatPercent = (val: number) => {
        return val.toFixed(2) + '%';
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '2rem', height: '2rem', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--text-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style jsx>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '4rem' }}>
            {/* Header */}
            <header style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-panel)' }}>
                <div className="container" style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>AlphaLens</h1>
                    <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
                        Sign Out
                    </button>
                </div>
            </header>

            <main className="container" style={{ paddingTop: '2rem' }}>
                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                    <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                        + Add Transaction
                    </button>
                </div>

                {/* Market Watch and Watchlist Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>

                    {/* Market Watch */}
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Market Watch</h2>
                        {marketData ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                                {/* Indices */}
                                {marketData.indices.map((item: any) => (
                                    <div key={item.symbol} className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--text-accent)' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{item.symbol}</div>
                                        <div style={{ fontSize: '1.125rem', marginTop: '0.25rem' }}>{formatCurrency(item.price || 0)}</div>
                                        <div style={{ fontSize: '0.75rem', color: (item.changePercent || 0) >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                                            {(item.changePercent || 0) >= 0 ? '+' : ''}{formatPercent(item.changePercent || 0)}
                                        </div>
                                    </div>
                                ))}
                                {/* M7 */}
                                {marketData.m7.map((item: any) => (
                                    <div key={item.symbol} className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-secondary)' }}>{item.symbol}</div>
                                        <div style={{ fontSize: '1.125rem', marginTop: '0.25rem' }}>{formatCurrency(item.price || 0)}</div>
                                        <div style={{ fontSize: '0.75rem', color: (item.changePercent || 0) >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                                            {(item.changePercent || 0) >= 0 ? '+' : ''}{formatPercent(item.changePercent || 0)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Loading Market Data...</div>
                        )}
                    </div>

                    {/* Personal Watchlist */}
                    <div>
                        <Watchlist />
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Equity</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                            {stats ? formatCurrency(stats.totalEquity) : '$0.00'}
                        </div>
                    </div>

                    <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total P/L</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: (stats?.totalPL || 0) >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                            {stats ? formatCurrency(stats.totalPL) : '$0.00'}
                        </div>
                        <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: (stats?.totalPL || 0) >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                            {(stats?.totalPL || 0) >= 0 ? '+' : ''}
                            {formatCurrency(stats?.totalPL || 0)} All Time
                        </div>
                    </div>

                    <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Day P/L (Unrealized)</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: (stats?.totalUnrealizedPL || 0) >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                            {stats ? formatCurrency(stats.totalUnrealizedPL) : '$0.00'}
                        </div>
                    </div>
                </div>

                {/* Holdings Table */}
                <div className="glass" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Holdings</h2>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>Symbol</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>Price</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>Quantity</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>Avg Cost</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>Market Value</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>Unrealized P/L</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holdings.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            No active holdings. Add a transaction to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    holdings.map((h) => (
                                        <tr key={h.symbol} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                            <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{h.symbol}</td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                                {formatCurrency(h.currentPrice)}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>{h.quantity}</td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>{formatCurrency(h.averageCost)}</td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(h.marketValue)}</td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                                <div style={{ color: h.unrealizedPL >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)', fontWeight: 600 }}>
                                                    {h.unrealizedPL >= 0 ? '+' : ''}{formatCurrency(h.unrealizedPL)}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: h.unrealizedPL >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                                                    {h.unrealizedPLPercent >= 0 ? '+' : ''}{formatPercent(h.unrealizedPLPercent)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <TransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchPortfolio}
            />
        </div>
    );
}
