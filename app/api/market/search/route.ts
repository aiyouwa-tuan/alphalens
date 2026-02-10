import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
// @ts-ignore
import translate from 'google-translate-api-x';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    let query = searchParams.get('q');
    const lang = searchParams.get('lang') || 'en-US'; // Default to English if not specified
    const isChinese = lang.startsWith('zh');

    if (!query) {
        return NextResponse.json({ results: [] });
    }

    try {
        // If query contains Chinese characters, translate to English first for better Yahoo search results
        if (/[\u4e00-\u9fa5]/.test(query)) {
            try {
                const translated = await translate(query, { to: 'en' }) as any;
                if (translated.text) {
                    console.log(`Translating query: ${query} -> ${translated.text}`);
                    query = translated.text;
                }
            } catch (e) {
                console.error("Query translation failed:", e);
            }
        }

        let results: any = { quotes: [] };
        try {
            results = await yahooFinance.search(query!, {
                quotesCount: 5,
                newsCount: 0,
                lang: lang,
                // @ts-ignore
                validation: { logErrors: false } // Try to suppress validation logging
            }) as any;
        } catch (yahooError: any) {
            console.error('Yahoo Finance Search Error:', yahooError);
            // If it's a validation error, we might still have data in yahooError.result? 
            // Often yahoo-finance2 throws but doesn't return partial data easily. 
            // We'll return empty results to verify if this is the cause.
            return NextResponse.json({ results: [] });
        }

        if (!results.quotes) {
            return NextResponse.json({ results: [] });
        }

        // Filter valid quotes first
        const quotes = results.quotes.filter((q: any) =>
            q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'INDEX'
        );

        // Process translations in parallel
        const formatted = await Promise.all(quotes.map(async (quote: any) => {
            // Prefer shortname (e.g. "Tootsie Roll") over longname (e.g. "Tootsie Roll Industries, Inc.")
            let name = quote.shortname || quote.longname || quote.symbol;

            // If user requested Chinese but we got English (ASCII names), try to translate
            // Only translate if it looks like a company name (not just a symbol) and is all ASCII
            if (isChinese && name && /^[\x00-\x7F]+$/.test(name) && name !== quote.symbol) {
                try {
                    // Force translate to zh-CN
                    const res = await translate(name, { to: 'zh-CN' }) as any;
                    // Only use translation if it's different and not empty
                    if (res.text && res.text !== name) {
                        name = res.text;
                    }
                } catch (e) {
                    console.error(`Translation failed for ${name}:`, e);
                }
            }

            return {
                symbol: quote.symbol,
                name: name,
                type: quote.quoteType,
                exchange: quote.exchange
            };
        }));

        return NextResponse.json({ results: formatted });
    } catch (error) {
        console.error('Search API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch search results' }, { status: 500 });
    }
}
