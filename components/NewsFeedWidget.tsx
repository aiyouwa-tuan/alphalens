'use client';

import React from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';

interface NewsItem {
    id: string;
    headline?: string;
    title?: string;
    source: string;
    url: string;
    publishedAt?: number | string; // Unix timestamp or ISO string
    pubDate?: string; // RSS format
    summary?: string;
    contentSnippet?: string;
}

interface NewsFeedWidgetProps {
    items: NewsItem[];
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

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-lg p-5 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-wider uppercase">{t('liveMarketNews')}</h3>
                <button className="text-xs text-[var(--text-accent)] hover:text-white transition-colors">{t('viewAll')}</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {loading ? (
                    <div className="text-sm text-[var(--text-muted)]">{t('loadingNews')}</div>
                ) : news.length === 0 ? (
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
                                        {item.headline}
                                    </a>
                                    <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                                        {item.summary}
                                    </p>
                                )}
                                </a>
                            </div>
                            ))
                            ) : (
                            <div className="text-center text-[var(--text-muted)] py-8">
                                No recent news updates.
                            </div>
                )}
                        </div>
        </div>
            );
}
