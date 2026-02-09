'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';

interface NewsItem {
    id: number;
    headline: string;
    summary: string;
    url: string;
    source: string;
    datetime: number;
    image: string;
}

export default function NewsFeedWidget() {
    const { t, language } = useLanguage();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNews() {
            setLoading(true);
            try {
                // Pass current language to API
                const res = await fetch(`/api/news?symbol=general&lang=${language}`);
                if (!res.ok) throw new Error('Failed to fetch news');
                const data = await res.json();
                setNews(data.news || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchNews();
    }, [language]); // Re-fetch when language changes

    if (loading) {
        return (
            <div className="bg-[var(--bg-panel)] rounded-lg border border-[var(--border-subtle)] p-4 h-[400px] animate-pulse">
                <div className="h-4 bg-[var(--bg-subtle)] w-1/3 mb-4 rounded"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex flex-col gap-2">
                            <div className="h-3 bg-[var(--bg-subtle)] w-3/4 rounded"></div>
                            <div className="h-2 bg-[var(--bg-subtle)] w-1/2 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-lg p-5 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-wider uppercase">{t('liveMarketNews')}</h3>
                <button className="text-xs text-[var(--text-accent)] hover:text-white transition-colors">{t('viewAll')}</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {news.length === 0 ? (
                    <div className="text-sm text-[var(--text-muted)]">{t('noNews')}</div>
                ) : (
                    news.map((item, i) => (
                        <div key={i} className="group cursor-pointer">
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-app)] px-1.5 py-0.5 rounded uppercase">
                                            {item.source}
                                        </span>
                                        <span className="text-[10px] text-[var(--text-secondary)]">
                                            {new Date(item.datetime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="block text-sm font-medium text-white group-hover:text-[var(--text-accent)] transition-colors line-clamp-2 mb-1">
                                        {item.headline || item.summary}
                                    </a>
                                    <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed mt-1">
                                        {item.summary}
                                    </p>
                                </div>
                            </div>
                            {i < news.length - 1 && <div className="h-px bg-[var(--border-subtle)] mt-4" />}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
