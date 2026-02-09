import { NextResponse } from 'next/server';
import { fetchRSSFeeds } from '@/lib/rss'; // Fixed import path - implementation used default export? No, typically named. Checking lib/rss.ts...
// re-reading lib/rss.ts content from previous step: "export async function fetchRSSFeeds..." - Correct.
import { RSS_FEEDS } from '@/lib/config_sources';

export async function GET() {
    // Combine all categories for the main feed
    const allFeeds = [
        ...RSS_FEEDS.finance,
        ...RSS_FEEDS.geopolitics,
        ...RSS_FEEDS.tech,
    ];

    const news = await fetchRSSFeeds(allFeeds);

    return NextResponse.json({ items: news });
}
