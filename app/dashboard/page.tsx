'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const fetchPortfolio = async () => {
        try {
            const res = await fetch('/api/portfolio', { cache: 'no-store' });
            if (res.status === 401) {
                setIsLoggedIn(false);
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setIsLoggedIn(true);
                if (data.stats) {
                    setStats(data.stats);
                    setHoldings(data.holdings);
                }
            }
        } catch (error) {
            console.error('Failed to fetch portfolio', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMarketData = async () => {
        try {
            const res = await fetch('/api/market-overview', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setMarketData(data);
            }
        } catch (error) {
            console.error('Failed to fetch market data', error);
        }
    };

    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        const promises = [fetchMarketData()];
        if (isLoggedIn) {
            promises.push(fetchPortfolio());
        }
        await Promise.all(promises);
        setLastUpdated(new Date());
        setIsRefreshing(false);
    };

    useEffect(() => {
        fetchPortfolio();
        fetchMarketData();
        setLastUpdated(new Date());
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

    const getSymbolLabel = (symbol: string) => {
        const map: Record<string, string> = {
            '^DJI': 'Dow Jones',
            '^IXIC': 'Nasdaq',
            '^GSPC': 'S&P 500',
            '^HSI': 'Hang Seng',
            'HSTECH.HK': 'HS Tech',
            '^HSTECH': 'HS Tech', // Keeping fallback just in case
            '000001.SS': 'SSE Comp',
            '000300.SS': 'CSI 300',
            '399006.SZ': 'ChiNext'
        };
        return map[symbol] || symbol;
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

    const handleLogin = () => {
        router.push('/login');
    };

    // --- Guest Layout ---
    if (!isLoggedIn) {
        return (
            <div style={{ paddingBottom: '4rem' }}>
                {/* Guest Header */}
                <header style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-panel)' }}>
                    <div className="container" style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>AlphaLens</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="btn btn-secondary"
                                style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}
                            >
                                {isRefreshing ? 'Updating...' : 'Refresh'}
                            </button>
                            <button onClick={handleLogin} className="btn btn-primary" style={{ padding: '0.4rem 1.5rem', fontSize: '0.875rem' }}>
                                Sign In
                            </button>
                        </div>
                    </div>
                </header>

                <main className="container" style={{ paddingTop: '4rem' }}>

                    {/* Hero Section */}
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Master Your Market Vision
                        </h2>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2rem' }}>
                            Track your portfolio performance in real-time, analyze profit/loss, and stay ahead of market trends.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={handleLogin} className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}>
                                Get Started
                            </button>
                            <button onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })} className="btn btn-secondary" style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}>
                                View Market Data
                            </button>
                            <Link href="/dashboard/news" className="btn btn-secondary" style={{ padding: '0.8rem 2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                                <span>📰</span> News
                            </Link>
                        </div>
                    </div>

                    {/* Market Data Grid (Prominent for Guests) */}
                    <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                        {/* Market Indices Card */}
                        <div className="card" style={{ height: '100%' }}>
                            <div className="card-header" style={{ paddingBottom: '0.5rem' }}>
                                <span className="card-title">🌏 Global Indices</span>
                            </div>
                            {marketData ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {[
                                        { title: '🇺🇸 US Markets', data: marketData.indices.us },
                                        { title: '🇭🇰 HK Markets', data: marketData.indices.hk },
                                        { title: '🇨🇳 China Markets', data: marketData.indices.cn }
                                    ].map((region, idx) => (
                                        <div key={region.title} style={{ borderTop: idx > 0 ? '1px solid var(--border-subtle)' : 'none', paddingTop: idx > 0 ? '1rem' : '0' }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {region.title}
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                                                {region.data.map((item: any) => (
                                                    <div key={item.symbol} className="market-item-card" style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                                            <span style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: '1.2' }}>{getSymbolLabel(item.symbol)}</span>
                                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: (item.changePercent || 0) >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                                                                {(item.changePercent || 0) >= 0 ? '+' : ''}{formatPercent(item.changePercent || 0)}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatCurrency(item.price || 0)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>Loading market data...</div>
                            )}
                        </div>

                        {/* Market Watch / Movers (Guest View) */}
                        <div className="card" style={{ height: '100%' }}>
                            <div className="card-header">
                                <span className="card-title">🔥 Market Watch</span>
                            </div>
                            {marketData ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                                    {/* ETFs Row */}
                                    {marketData.etfs && (
                                        <div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                ETFs
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                                                {marketData.etfs.map((item: any) => (
                                                    <div key={item.symbol} className="market-item-card" style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                                            <span style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: '1.2' }}>{item.symbol}</span>
                                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: (item.changePercent || 0) >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                                                                {(item.changePercent || 0) >= 0 ? '+' : ''}{formatPercent(item.changePercent || 0)}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatCurrency(item.price || 0)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Rates Row */}
                                    {marketData.rates && (
                                        <div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Rates
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                                                {marketData.rates.map((item: any) => (
                                                    <div key={item.symbol} className="market-item-card" style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                                            <span style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: '1.2' }}>{item.name}</span>
                                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: (item.changePercent || 0) >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                                                                {(item.changePercent || 0) >= 0 ? '+' : ''}{formatPercent(item.changePercent || 0)}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                                                            {item.price ? item.price.toFixed(3) + '%' : '0.00%'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Stocks Row */}
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Key Stocks (By Market Cap)
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                                            {marketData.stocks.map((item: any) => (
                                                <div key={item.symbol} className="market-item-card" style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: '1.2' }}>{item.symbol}</span>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: (item.changePercent || 0) >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                                                            {(item.changePercent || 0) >= 0 ? '+' : ''}{formatPercent(item.changePercent || 0)}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatCurrency(item.price || 0)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            ) : (
                                <div style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>Loading...</div>
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: '4rem', padding: '3rem', backgroundColor: 'var(--bg-panel)', borderRadius: '1rem', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Ready to start tracking?</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Join AlphaLens today to create your personalized portfolio dashboard.</p>
                        <button onClick={handleLogin} className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>
                            Create Free Account
                        </button>
                    </div>

                </main>
            </div>
        );
    }

    // --- Authenticated User Layout ---
    return (
        <div style={{ paddingBottom: '4rem' }}>
            {/* Header */}
            <header style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-panel)' }}>
                <div className="container" style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>AlphaLens</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {lastUpdated && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                Updated: {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 1rem', fontSize: '0.875rem', minWidth: '100px' }}
                        >
                            {isRefreshing ? 'Updating...' : 'Refresh'}
                        </button>
                        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <main className="container" style={{ paddingTop: '2rem' }}>
                {/* 1. Header & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Portfolio Overview</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Welcome back, Investor</p>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/dashboard/news" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>📰</span> Market News
                        </Link>
                        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                            + Add Transaction
                        </button>
                    </div>
                </div>

                {/* 2. Key Stats Row */}
                <div className="stats-grid">
                    <div className="card">
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Equity</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>
                            {stats ? formatCurrency(stats.totalEquity) : '$0.00'}
                        </div>
                    </div>

                    <div className="card">
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Profit/Loss</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem', color: (stats?.totalPL || 0) >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                            {stats ? formatCurrency(stats.totalPL) : '$0.00'}
                        </div>
                        <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: (stats?.totalPL || 0) >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                            {(stats?.totalPL || 0) >= 0 ? '+' : ''}
                            {formatCurrency(stats?.totalPL || 0)} All Time
                        </div>
                    </div>

                    <div className="card">
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Day's Change (Unrealized)</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem', color: (stats?.totalUnrealizedPL || 0) >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                            {stats ? formatCurrency(stats.totalUnrealizedPL) : '$0.00'}
                        </div>
                    </div>
                </div>

                {/* 3. Main Split Layout */}
                <div className="dashboard-grid">

                    {/* LEFT COLUMN: Holdings (Primary Content) */}
                    <div>
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">My Holdings</span>
                            </div>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Symbol</th>
                                            <th style={{ textAlign: 'right' }}>Price</th>
                                            <th style={{ textAlign: 'right' }}>Qty</th>
                                            <th style={{ textAlign: 'right' }}>Avg Cost</th>
                                            <th style={{ textAlign: 'right' }}>Value</th>
                                            <th style={{ textAlign: 'right' }}>Unrealized P/L</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {holdings.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                    No holdings yet. Added transactions will appear here.
                                                </td>
                                            </tr>
                                        ) : (
                                            holdings.map((h) => (
                                                <tr key={h.symbol}>
                                                    <td style={{ fontWeight: 600 }}>{h.symbol}</td>
                                                    <td style={{ textAlign: 'right' }}>{formatCurrency(h.currentPrice)}</td>
                                                    <td style={{ textAlign: 'right' }}>{h.quantity}</td>
                                                    <td style={{ textAlign: 'right' }}>{formatCurrency(h.averageCost)}</td>
                                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(h.marketValue)}</td>
                                                    <td style={{ textAlign: 'right' }}>
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
                    </div>

                    {/* RIGHT COLUMN: Sidebar (Market & Watchlist) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Global Indices Card (Grid Style) */}
                        <div className="card">
                            <div className="card-header" style={{ paddingBottom: '0.5rem' }}>
                                <span className="card-title">🌏 Global Indices</span>
                            </div>
                            {marketData ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {[
                                        { title: '🇺🇸 US', data: marketData.indices.us },
                                        { title: '🇭🇰 HK', data: marketData.indices.hk },
                                        { title: '🇨🇳 CN', data: marketData.indices.cn }
                                    ].map((region, idx) => (
                                        <div key={region.title} style={{ borderTop: idx > 0 ? '1px solid var(--border-subtle)' : 'none', paddingTop: idx > 0 ? '1rem' : '0' }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {region.title}
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                                                {region.data.map((item: any) => (
                                                    <div key={item.symbol} className="market-item-card" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: '1.2' }}>{getSymbolLabel(item.symbol)}</span>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: (item.changePercent || 0) >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                                                                {(item.changePercent || 0) >= 0 ? '+' : ''}{formatPercent(item.changePercent || 0)}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{formatCurrency(item.price || 0)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>Loading market...</div>
                            )}
                        </div>

                        {/* Market Watch Card */}
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">🔥 Market Watch</span>
                            </div>
                            {marketData ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                    {/* ETFs Row */}
                                    {marketData.etfs && (
                                        <div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                ETFs
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                                                {marketData.etfs.map((item: any) => (
                                                    <div key={item.symbol} className="market-item-card" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: '1.2' }}>{item.symbol}</span>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: (item.changePercent || 0) >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                                                                {(item.changePercent || 0) >= 0 ? '+' : ''}{formatPercent(item.changePercent || 0)}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{formatCurrency(item.price || 0)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Rates Row */}
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Rates
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                                            {/* Render actual rates or valid fallback */}
                                            {(marketData.rates && marketData.rates.length > 0 ? marketData.rates : [{ symbol: '^TNX', name: 'US 10Y', price: 0 }]).map((item: any) => (
                                                <div key={item.symbol} className="market-item-card" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: '1.2' }}>{item.name}</span>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: (item.changePercent || 0) >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                                                            {(item.changePercent || 0) >= 0 ? '+' : ''}{formatPercent(item.changePercent || 0)}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                                                        {item.price ? item.price.toFixed(3) + '%' : 'Loading...'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Stocks Row */}
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Key Stocks (By Market Cap)
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                                            {marketData.stocks.map((item: any) => (
                                                <div key={item.symbol} className="market-item-card" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: '1.2' }}>{item.symbol}</span>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: (item.changePercent || 0) >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                                                            {(item.changePercent || 0) >= 0 ? '+' : ''}{formatPercent(item.changePercent || 0)}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>{formatCurrency(item.price || 0)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            ) : (
                                <div style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>Loading...</div>
                            )}
                        </div>

                        {/* Watchlist Component - Only for logged in users */}
                        <Watchlist />

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



