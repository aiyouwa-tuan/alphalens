'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

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
    }, [language]);

    if (loading) {
        return (
            <div className="bg-white rounded-[20px] p-5 h-[400px] animate-pulse">
                <div className="h-4 bg-slate-100 w-1/3 mb-4 rounded"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex flex-col gap-2">
                            <div className="h-3 bg-slate-100 w-3/4 rounded"></div>
                            <div className="h-2 bg-slate-100 w-1/2 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-none p-5 h-full flex flex-col">
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-xs font-bold text-slate-500 tracking-widest uppercase">{t('liveMarketNews')}</h3>
                <Link href="/dashboard/news" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">{t('viewAll')} →</Link>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                {news.length === 0 ? (
                    <div className="text-sm text-slate-400 font-medium">{t('noNews')}</div>
                ) : (
                    news.map((item, i) => (
                        <div key={i} className="group">
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1.5">
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md uppercase border border-blue-100">
                                            {item.source}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {new Date(item.datetime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="block text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1.5 leading-snug">
                                        {item.headline || item.summary}
                                    </a>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                        {item.summary}
                                    </p>
                                </div>
                            </div>
                            {i < news.length - 1 && <div className="h-px bg-slate-100 mt-4" />}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
