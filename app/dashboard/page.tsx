'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TransactionModal from '@/app/components/TransactionModal';

// Components
import TopBar from '@/components/TopBar';
import PortfolioMainChart from '@/components/PortfolioMainChart';
import MarketFlowWidget from '@/components/MarketFlowWidget';
import NewsFeedWidget from '@/components/NewsFeedWidget';
import MacroWidget from '@/components/MacroWidget';
import CryptoWidget from '@/components/CryptoWidget';

// Types (Keep existing types)
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
    const [newsItems, setNewsItems] = useState<any[]>([]);

    // Determine auth state
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Portfolio & Market Overview
                const [folioRes, marketRes, newsRes] = await Promise.all([
                    fetch('/api/portfolio', { cache: 'no-store' }),
                    fetch('/api/market-overview', { cache: 'no-store' }),
                    fetch('/api/news/rss', { next: { revalidate: 60 } })
                ]);

                if (folioRes.ok) {
                    const folioData = await folioRes.json();
                    setStats(folioData.stats);
                    setHoldings(folioData.holdings);
                    setIsLoggedIn(true);
                    generateMockHistory(folioData.stats?.totalEquity || 10000);
                } else {
                    generateMockHistory(10000); // Guest mock
                }

                if (marketRes.ok) {
                    const mData = await marketRes.json();
                    setMarketData(mData);
                }

                if (newsRes.ok) {
                    const newsData = await newsRes.json();
                    setNewsItems(newsData.items || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const generateMockHistory = (baseValue: number) => {
        const history = [];
        let value = baseValue * 0.9;
        const now = new Date();
        for (let i = 30; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            value = value * (1 + (Math.random() * 0.04 - 0.015));
            history.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: value
            });
        }
        setChartData(history);
    };

    if (loading) return null; // Or a skeleton

    return (
        <div className="flex flex-col w-full min-h-screen bg-[var(--bg-app)]">
            <TopBar />

            <main className="p-4 md:p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-min">

                    {/* --- ROW 1: Portfolio Chart (Large) + Stats --- */}

                    {/* Chart Area: Spans 8 cols */}
                    <div className="md:col-span-8 flex flex-col h-[400px]">
                        <PortfolioMainChart data={chartData} />
                    </div>

                    {/* Quick Stats: Spans 4 cols - Stacked Cards */}
                    <div className="md:col-span-4 flex flex-col gap-4 h-[400px]">

                        {/* Equity Card */}
                        <div className="flex-1 bg-[var(--bg-panel)] rounded-xl border border-[var(--border-subtle)] p-6 flex flex-col justify-center">
                            <span className="text-[var(--text-secondary)] text-sm font-medium uppercase tracking-wider">Total Equity</span>
                            <div className="text-4xl font-bold text-white mt-2 font-mono">
                                {stats ? `$${stats.totalEquity.toLocaleString()}` : '$0.00'}
                            </div>
                            <div className={`mt-2 text-sm font-medium ${stats?.totalPL && stats.totalPL >= 0 ? 'text-[var(--color-success-text)]' : 'text-[var(--color-danger-text)]'}`}>
                                {stats?.totalPL && stats.totalPL >= 0 ? '▲' : '▼'} {stats ? `$${Math.abs(stats.totalPL).toLocaleString()}` : '0.00'} All Time
                            </div>
                        </div>

                        {/* Market Sentiment / News Widget */}
                        <div className="flex-[2] overflow-hidden">
                            <NewsFeedWidget items={newsItems} />
                        </div>
                    </div>

                    {/* --- ROW 2: Market Data Grid (4 Cols x 3) --- */}

                    {/* Macro Data: Col 3 */}
                    <div className="md:col-span-3 h-[300px]">
                        <MacroWidget />
                    </div>

                    {/* Indices: Col 3 */}
                    <div className="md:col-span-3 h-[300px]">
                        <MarketFlowWidget
                            title="Global Indices"
                            items={[...(marketData?.indices?.us || []), ...(marketData?.indices?.hk || [])].slice(0, 5)}
                        />
                    </div>

                    {/* Crypto: Col 3 */}
                    <div className="md:col-span-3 h-[300px]">
                        <CryptoWidget />
                    </div>

                    {/* Blue Chips: Col 3 */}
                    <div className="md:col-span-3 h-[300px]">
                        <MarketFlowWidget
                            title="Blue Chips & Tech"
                            items={marketData?.stocks?.slice(0, 5) || []}
                        />
                    </div>

                    {/* --- ROW 3: Holdings Table (Full Width) --- */}
                    <div className="md:col-span-12 bg-[var(--bg-panel)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
                            <h3 className="font-bold text-white">Active Positions</h3>
                            <button className="text-xs text-[var(--text-accent)] hover:text-white transition-colors">Manage</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Asset</th>
                                        <th className="px-6 py-3 font-medium text-right">Price</th>
                                        <th className="px-6 py-3 font-medium text-right">Qty</th>
                                        <th className="px-6 py-3 font-medium text-right">Value</th>
                                        <th className="px-6 py-3 font-medium text-right">P/L</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-subtle)]">
                                    {holdings.length > 0 ? holdings.map(h => (
                                        <tr key={h.symbol} className="hover:bg-[var(--bg-subtle)]/50 transition-colors">
                                            <td className="px-6 py-3 font-bold">{h.symbol}</td>
                                            <td className="px-6 py-3 text-right font-mono">${h.currentPrice.toFixed(2)}</td>
                                            <td className="px-6 py-3 text-right">{h.quantity}</td>
                                            <td className="px-6 py-3 text-right font-mono">${h.marketValue.toLocaleString()}</td>
                                            <td className={`px-6 py-3 text-right font-medium ${h.unrealizedPL >= 0 ? 'text-[var(--color-success-text)]' : 'text-[var(--color-danger-text)]'}`}>
                                                {h.unrealizedPL >= 0 ? '+' : ''}{h.unrealizedPL.toFixed(2)}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-[var(--text-muted)]">No positions open.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
