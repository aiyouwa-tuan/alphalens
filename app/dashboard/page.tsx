'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TransactionModal from '@/app/components/TransactionModal';
import { useLanguage } from '@/components/LanguageProvider';

// Components
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

    const { t } = useLanguage();

    if (loading) return null; // Or a skeleton

    return (
        <div className="flex flex-col w-full min-h-[calc(100vh-64px)] bg-[var(--bg-app)]">
            <main className="p-4 md:p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-min">

                    {/* --- ROW 1: Market News --- */}
                    <div className="md:col-span-12 h-[400px] bg-[var(--bg-panel)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                        <NewsFeedWidget />
                    </div>

                    {/* --- ROW 2: Market Data Grid (4 Cols x 3) --- */}

                    {/* Macro Data: Col 3 */}
                    <div className="md:col-span-3 h-[300px]">
                        <MacroWidget />
                    </div>

                    {/* Indices: Col 3 */}
                    <div className="md:col-span-3 h-[300px]">
                        <MarketFlowWidget
                            title={t('globalIndices')}
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
                            title={t('blueChipsTech')}
                            items={marketData?.stocks?.slice(0, 5) || []}
                        />
                    </div>

                    {/* --- ROW 3: Holdings Table (Full Width) --- */}
                    <div className="md:col-span-12 bg-[var(--bg-panel)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
                            <h3 className="font-bold text-white">{t('activePositions')}</h3>
                            <button className="text-xs text-[var(--text-accent)] hover:text-white transition-colors">{t('manage')}</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">{t('asset')}</th>
                                        <th className="px-6 py-3 font-medium text-right">{t('price')}</th>
                                        <th className="px-6 py-3 font-medium text-right">{t('qty')}</th>
                                        <th className="px-6 py-3 font-medium text-right">{t('value')}</th>
                                        <th className="px-6 py-3 font-medium text-right">{t('pl')}</th>
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
                                            <td colSpan={5} className="px-6 py-8 text-center text-[var(--text-muted)]">{t('noPositions')}</td>
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
