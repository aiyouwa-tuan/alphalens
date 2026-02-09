'use client';

import React from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';

interface NewsItem {
    id: string;
    headline: string;
    source: string;
    url: string;
    publishedAt: number; // Unix timestamp
    summary?: string;
}

interface NewsFeedWidgetProps {
    items: NewsItem[];
    isLoading?: boolean;
}

export default function NewsFeedWidget({ items, isLoading }: NewsFeedWidgetProps) {
    if (isLoading) {
        return (
            <div className="bg-[var(--bg-panel)] rounded-lg border border-[var(--border-subtle)] p-4 h-[400px] animate-pulse">
                <div className="h-6 bg-[var(--bg-subtle)] w-1/2 mb-4 rounded"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex flex-col gap-2">
                            <div className="h-4 bg-[var(--bg-subtle)] w-3/4 rounded"></div>
                            <div className="h-3 bg-[var(--bg-subtle)] w-1/2 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-[var(--bg-panel)] rounded-lg border border-[var(--border-subtle)] overflow-hidden flex flex-col h-full max-h-[500px]">
            <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Live Market News</h3>
                <Link href="/dashboard/news" className="text-xs text-[var(--text-accent)] hover:underline">View All</Link>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {items && items.length > 0 ? (
                    items.map((item) => (
                        <div key={item.id} className="group cursor-pointer">
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded">
                                        {item.source}
                                    </span>
                                    <span className="text-[10px] text-[var(--text-secondary)]">
                                        {new Date(item.publishedAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <h4 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--text-accent)] transition-colors line-clamp-2">
                                    {item.headline}
                                </h4>
                                {item.summary && (
                                    <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
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
