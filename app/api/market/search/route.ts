import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const lang = searchParams.get('lang') || 'en-US'; // Default to English if not specified

    if (!query) {
        return NextResponse.json({ results: [] });
    }

    try {
        const results = await yahooFinance.search(query, {
            quotesCount: 5,
            newsCount: 0,
            lang: lang // Pass language to Yahoo Finance
        });

        // Filter and map results to a useful format
        const formatted = results.quotes.map((quote: any) => ({
            symbol: quote.symbol,
            // Prefer shortname (e.g. "Tootsie Roll") over longname (e.g. "Tootsie Roll Industries, Inc.")
            name: quote.shortname || quote.longname || quote.symbol,
            type: quote.quoteType,
            exchange: quote.exchange
        })).filter((q: any) => q.type === 'EQUITY' || q.type === 'ETF' || q.type === 'INDEX');

        return NextResponse.json({ results: formatted });
    } catch (error) {
        console.error('Search API Error:', error);
        return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
    }
}
