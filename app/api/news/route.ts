import { NextResponse } from 'next/server';
const translate = require('google-translate-api-x').default || require('google-translate-api-x');

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// Cache translation results briefly or just rely on Next.js fetch caching if applicable.
// For now, simple direct fetch.

async function fetchFinnhubNews(symbol: string) {
    if (!FINNHUB_API_KEY) throw new Error("Missing FINNHUB_API_KEY");

    // Get news from last 3 days
    const today = new Date().toISOString().split('T')[0];
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];

    // Use 'general' if no symbol (Finnhub 'general' category needs different endpoint)
    // company-news requires symbol.
    // If symbol is 'market' or empty, use 'general' category?
    // Finnhub General News: /news?category=general

    let url = '';
    if (symbol === 'general' || !symbol) {
        url = `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`;
    } else {
        url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${threeDaysAgo}&to=${today}&token=${FINNHUB_API_KEY}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Finnhub API Error: ${res.status}`);
    return await res.json();
}

async function translateText(text: string): Promise<string> {
    try {
        if (!text) return '';
        const res = await translate(text, { to: 'zh-CN', forceBatch: false });
        return res.text;
    } catch (error) {
        console.error("Translation error for:", text, error);
        return text; // Fallback to original
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol') || 'general';

        const newsItems = await fetchFinnhubNews(symbol);

        // Take top 10 to avoid hitting translation rate limits too hard
        const topNews = newsItems.slice(0, 10);

        // Translate in parallel
        const translatedNews = await Promise.all(topNews.map(async (item: any) => {
            // Translate Headline and Summary
            // Optimization: Combine them to send 1 request? No, keep simple.
            const [zhHeadline, zhSummary] = await Promise.all([
                translateText(item.headline),
                translateText(item.summary)
            ]);

            return {
                ...item,
                headline: zhHeadline,
                summary: zhSummary,
                original_headline: item.headline
            };
        }));

        return NextResponse.json({ news: translatedNews });
    } catch (error) {
        console.error("News API Error:", error);
        return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
    }
}
