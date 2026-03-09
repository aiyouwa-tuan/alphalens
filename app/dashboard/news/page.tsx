'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import ManageFiltersModal from '@/components/ManageFiltersModal';
import { supabase } from '@/lib/supabase';

// Initial default filters
const DEFAULT_FILTERS = [
    { id: 'all', keywords: [] },
    { id: 'TSM', keywords: ['TSM', 'TMSC', '台积电', 'Taiwan Semiconductor'] },
    { id: 'AAPL', keywords: ['Apple', 'AAPL', 'iPhone', 'Mac', '苹果', '库克'] },
    { id: 'TSLA', keywords: ['Tesla', 'TSLA', 'Musk', 'EV', '特斯拉', '马斯克'] },
    { id: 'NVDA', keywords: ['Nvidia', 'NVDA', 'GPU', 'AI', 'Chip', '英伟达', '黄仁勋', '芯片'] },
    { id: 'MSFT', keywords: ['Microsoft', 'MSFT', 'Windows', 'Azure', 'Office', 'Copilot', '微软'] },
    { id: 'AMZN', keywords: ['Amazon', 'AMZN', 'AWS', 'Prime', 'Bezos', 'Jassy', '亚马逊'] },
    { id: 'GOOG', keywords: ['Google', 'GOOG', 'Alphabet', 'Android', 'Gemini', 'Sundar', '谷歌', '搜索'] },
    { id: 'META', keywords: ['Meta', 'Facebook', 'Zuckerberg', 'Instagram', 'WhatsApp', 'Reality Labs', '脸书', '扎克伯格'] },
];

export default function NewsPage() {
    const { t, language, setLanguage } = useLanguage();

    // State for filters (persisted logic could be added here)
    const [filters, setFilters] = useState(DEFAULT_FILTERS);

    // Modal State
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

    const [selectedFilter, setSelectedFilter] = useState('all');
    const [filteredNews, setFilteredNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Auth State
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const client = supabase;
        if (!client) return;
        const checkUser = async () => {
            const { data: { session } } = await client.auth.getSession();
            setUser(session?.user || null);
        };
        checkUser();

        const { data: { subscription } } = client.auth.onAuthStateChange((_event: any, session: any) => {
            setUser(session?.user || null);
        });
        return () => subscription.unsubscribe();
    }, []);

    // Load filters from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('news_filters');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setFilters(parsed);
                }
            } catch (e) {
                console.error("Failed to parse saved filters", e);
            }
        }
    }, []);

    // Save filters to localStorage whenever they change
    useEffect(() => {
        if (filters !== DEFAULT_FILTERS) {
            localStorage.setItem('news_filters', JSON.stringify(filters));
        }
    }, [filters]);

    // Helper to get translated filter name
    const getFilterName = (filter: any) => {
        return filter.name || t(`filter_${filter.id}` as any) || filter.id;
    };

    async function fetchNews(symbolId: string) {
        setLoading(true);
        // Map 'all' to 'general' for the API
        const querySymbol = symbolId === 'all' ? 'general' : symbolId;

        try {
            const res = await fetch(`/api/news?symbol=${querySymbol}&lang=${language}`);
            const data = await res.json();

            if (data.news) {
                // Strict Relevance Filter
                const currentFilter = filters.find(f => f.id === symbolId);
                const keywords = currentFilter ? currentFilter.keywords : [];

                if (symbolId !== 'all' && keywords.length > 0) {
                    const strictNews = data.news.filter((item: any) => {
                        const content = `${item.headline} ${item.summary} ${item.original_headline || ''}`.toLowerCase();
                        return keywords.some(k => content.includes(k.toLowerCase()));
                    });
                    setFilteredNews(strictNews);
                } else {
                    setFilteredNews(data.news);
                }
            } else {
                setFilteredNews([]);
            }
        } catch (error) {
            console.error("Error fetching news:", error);
            setFilteredNews([]);
        } finally {
            setLoading(false);
        }
    }

    // Effect to fetch when filter or language changes
    useEffect(() => {
        fetchNews(selectedFilter);
    }, [selectedFilter, language, filters]); // Re-fetch if filters change (e.g. keywords update)

    const handleAddFilter = (newFilter: any) => {
        setFilters(prev => [...prev, newFilter]);
    };

    const handleDeleteFilter = (id: string) => {
        setFilters(prev => prev.filter(f => f.id !== id));
        if (selectedFilter === id) {
            setSelectedFilter('all');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen">
            <ManageFiltersModal
                isOpen={isManageModalOpen}
                onClose={() => setIsManageModalOpen(false)}
                filters={filters}
                onAdd={handleAddFilter}
                onDelete={handleDeleteFilter}
            />

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">{t('marketHeadlines')}</h1>
                    <p className="text-[var(--text-secondary)]">{t('newsSubtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                        className="px-3 py-2 border border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors text-sm font-semibold text-[var(--text-primary)]"
                    >
                        {language === 'en' ? 'CN' : 'EN'}
                    </button>
                    <Link href="/dashboard" className="px-4 py-2 bg-[var(--bg-panel)] border border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors text-sm font-semibold text-[var(--text-primary)]">
                        {t('backToDashboard')}
                    </Link>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Filter */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-4 sticky top-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-[var(--text-secondary)] text-xs uppercase tracking-wider">{t('marketFocus')}</h3>
                            {user && (
                                <button
                                    onClick={() => setIsManageModalOpen(true)}
                                    className="text-xs text-[var(--text-accent)] hover:text-[var(--text-primary)] transition-colors font-medium"
                                >
                                    {t('manage')}
                                </button>
                            )}
                        </div>
                        <div className="space-y-1">
                            {filters.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedFilter(item.id)}
                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedFilter === item.id
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                                        }`}
                                >
                                    {getFilterName(item)}
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
                                ? t('loadingLatestNews')
                                : `${t('noRecentNews')} ${getFilterName(filters.find(f => f.id === selectedFilter) || { id: selectedFilter })}`}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredNews.map((item) => (
                                <a
                                    key={item.id}
                                    href={item.url || item.link}
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
                                                {new Date(item.datetime * 1000 || item.pubDate).toLocaleString()}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)] group-hover:text-[var(--text-accent)] transition-colors leading-snug">
                                            {item.headline || item.title}
                                        </h3>
                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                                            {item.summary || item.contentSnippet}
                                        </p>
                                        <div className="mt-4 flex items-center text-xs font-semibold text-[var(--text-accent)]">
                                            {t('readSource')} <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
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
