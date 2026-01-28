'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Predefined list of interesting symbols
const SYMBOLS = [
    { id: 'general', name: 'General (综合)' },
    { id: 'AAPL', name: 'Apple (苹果)' },
    { id: 'TSLA', name: 'Tesla (特斯拉)' },
    { id: 'NVDA', name: 'NVIDIA (英伟达)' },
    { id: 'MSFT', name: 'Microsoft (微软)' },
    { id: 'AMZN', name: 'Amazon (亚马逊)' },
    { id: 'GOOG', name: 'Google (谷歌)' },
    { id: 'META', name: 'Meta' },
    { id: 'AMD', name: 'AMD' },
    { id: 'INTC', name: 'Intel (英特尔)' },
];

export default function NewsPage() {
    const [selectedSymbol, setSelectedSymbol] = useState('general');
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchNews(selectedSymbol);
    }, [selectedSymbol]);

    async function fetchNews(symbol: string) {
        setLoading(true);
        try {
            const res = await fetch(`/api/news?symbol=${symbol}`);
            const data = await res.json();
            if (data.news) {
                setNews(data.news);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Market Headlines</h1>
                    <p className="text-gray-400">Real-time market news from around the world (Translated)</p>
                </div>
                <Link href="/dashboard" className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-sm font-semibold">
                    ← Back to Dashboard
                </Link>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Filter */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-[var(--bg-secondary)] rounded-xl p-4 sticky top-6">
                        <h3 className="font-bold text-gray-400 mb-4 text-xs uppercase tracking-wider">Market Focus</h3>
                        <div className="space-y-1">
                            {SYMBOLS.map(sym => (
                                <button
                                    key={sym.id}
                                    onClick={() => setSelectedSymbol(sym.id)}
                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedSymbol === sym.id
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'text-gray-400 hover:bg-[var(--bg-hover)] hover:text-white'
                                        }`}
                                >
                                    {sym.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="animate-pulse bg-[var(--bg-secondary)] h-80 rounded-xl"></div>
                            ))}
                        </div>
                    ) : news.length === 0 ? (
                        <div className="text-center py-20 text-gray-500 bg-[var(--bg-secondary)] rounded-xl">
                            No news found for this category recently.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {news.map((item) => (
                                <a
                                    key={item.id}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group block bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] rounded-xl overflow-hidden transition-all duration-300 border border-transparent hover:border-gray-700"
                                >
                                    <div className="flex flex-col md:flex-row">
                                        {/* Image */}
                                        {item.image && (
                                            <div className="w-full md:w-48 h-48 md:h-auto relative bg-gray-800 flex-shrink-0 overflow-hidden">
                                                <img
                                                    src={item.image}
                                                    alt={item.headline}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                                                />
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="p-6 flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full">
                                                        {item.category.toUpperCase()}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(item.datetime * 1000).toLocaleString('zh-CN')}
                                                    </span>
                                                    <span className="text-xs text-gray-500 ml-auto font-mono">
                                                        {item.source}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-bold mb-3 text-gray-100 group-hover:text-blue-400 transition-colors leading-snug">
                                                    {item.headline || item.original_headline}
                                                </h3>
                                                <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
                                                    {item.summary}
                                                </p>
                                            </div>
                                            <div className="mt-4 flex items-center text-xs font-semibold text-gray-500">
                                                Read full story <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
