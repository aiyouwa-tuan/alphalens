'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Detailed stock filters mapping to RSS keywords
const STOCK_FILTERS = [
    { id: 'all', name: 'General (综合)', keywords: [] },
    { id: 'TSM', name: 'TSM (台积电)', keywords: ['TSM', 'TSMC', 'Taiwan Semiconductor'] },
    { id: 'AAPL', name: 'Apple (苹果)', keywords: ['Apple', 'AAPL', 'iPhone', 'Mac'] },
    { id: 'TSLA', name: 'Tesla (特斯拉)', keywords: ['Tesla', 'TSLA', 'Musk', 'EV'] },
    { id: 'NVDA', name: 'NVIDIA (英伟达)', keywords: ['Nvidia', 'NVDA', 'GPU', 'AI'] },
    { id: 'MSFT', name: 'Microsoft (微软)', keywords: ['Microsoft', 'MSFT', 'Windows', 'Azure'] },
    { id: 'AMZN', name: 'Amazon (亚马逊)', keywords: ['Amazon', 'AMZN', 'AWS'] },
    { id: 'GOOG', name: 'Google (谷歌)', keywords: ['Google', 'GOOG', 'Alphabet', 'Android'] },
    { id: 'META', name: 'Meta', keywords: ['Meta', 'Facebook', 'Zuckerberg', 'Instagram'] },
];

export default function NewsPage() {
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [allNews, setAllNews] = useState<any[]>([]);
    const [filteredNews, setFilteredNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchNews();
    }, []);

    useEffect(() => {
        filterNews();
    }, [selectedFilter, allNews]);

    async function fetchNews() {
        setLoading(true);
        try {
            const res = await fetch('/api/news/rss');
            const data = await res.json();
            if (data.items) {
                setAllNews(data.items);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    function filterNews() {
        const filter = STOCK_FILTERS.find(c => c.id === selectedFilter);
        if (!filter) return;

        if (filter.id === 'all') {
            setFilteredNews(allNews);
            return;
        }

        const filtered = allNews.filter(item => {
            const text = (item.title + ' ' + (item.summary || '') + ' ' + (item.contentSnippet || '')).toLowerCase();
            return filter.keywords.some(k => text.includes(k.toLowerCase()));
        });
        setFilteredNews(filtered);
    }

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-white">Market Headlines</h1>
                    <p className="text-[var(--text-secondary)]">Real-time intelligence from global sources (Situation Monitor)</p>
                </div>
                <Link href="/dashboard" className="px-4 py-2 bg-[var(--bg-panel)] border border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors text-sm font-semibold text-white">
                    ← Back to Dashboard
                </Link>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Filter */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sticky top-6">
                        <h3 className="font-bold text-[var(--text-secondary)] mb-4 text-xs uppercase tracking-wider">Market Focus</h3>
                        <div className="space-y-1">
                            {STOCK_FILTERS.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedFilter(item.id)}
                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedFilter === item.id
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-white'
                                        }`}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {loading ? (
                        <div className="grid grid-cols-1 gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="animate-pulse bg-[var(--bg-panel)] h-48 rounded-xl border border-[var(--border-subtle)]"></div>
                            ))}
                        </div>
                    ) : filteredNews.length === 0 ? (
                        <div className="text-center py-20 text-[var(--text-muted)] bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl">
                            {selectedFilter === 'all'
                                ? 'Loading latest news...'
                                : `No recent news mentions found for ${STOCK_FILTERS.find(f => f.id === selectedFilter)?.name}.`}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredNews.map((item) => (
                                <a
                                    key={item.id}
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group block bg-[var(--bg-panel)] border border-[var(--border-subtle)] hover:border-[var(--text-accent)] rounded-xl overflow-hidden transition-all duration-300 p-6"
                                >
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xs font-bold text-[var(--bg-app)] bg-[var(--text-secondary)] px-2 py-1 rounded-full">
                                                {item.source}
                                            </span>
                                            <span className="text-xs text-[var(--text-muted)]">
                                                {new Date(item.pubDate).toLocaleString()}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold mb-3 text-white group-hover:text-[var(--text-accent)] transition-colors leading-snug">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                                            {item.contentSnippet || item.summary}
                                        </p>
                                        <div className="mt-4 flex items-center text-xs font-semibold text-[var(--text-accent)]">
                                            Read source <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
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
