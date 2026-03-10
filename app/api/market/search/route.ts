import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
// @ts-ignore
import translate from 'google-translate-api-x';

/**
 * Detect A-share ticker code and return the Yahoo Finance symbol with exchange suffix.
 * Shanghai: 6xxxxx, 9xxxxx → .SS
 * Shenzhen: 0xxxxx, 1xxxxx, 2xxxxx, 3xxxxx → .SZ
 */
function resolveAShareTicker(query: string): string | null {
    const trimmed = query.trim();
    if (/^\d{6}$/.test(trimmed)) {
        const first = trimmed[0];
        if (first === '6' || first === '9') {
            return `${trimmed}.SS`;
        }
        if (['0', '1', '2', '3'].includes(first)) {
            return `${trimmed}.SZ`;
        }
    }
    return null;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    let query = searchParams.get('q');
    const lang = searchParams.get('lang') || 'en-US';
    const isChinese = lang.startsWith('zh');

    if (!query) {
        return NextResponse.json({ results: [] });
    }

    try {
        // 1. Check if input is a 6-digit A-share stock code (e.g., "300750", "600519")
        const aShareSymbol = resolveAShareTicker(query);
        if (aShareSymbol) {
            try {
                const quote = await yahooFinance.quote(aShareSymbol, {}, { validateResult: false } as any);
                if (quote && quote.symbol) {
                    const name = (quote as any).longName || (quote as any).shortName || aShareSymbol;
                    return NextResponse.json({
                        results: [{
                            symbol: quote.symbol,
                            name: name,
                            type: (quote as any).quoteType || 'EQUITY',
                            exchange: (quote as any).exchange || ''
                        }]
                    });
                }
            } catch (e) {
                console.warn(`Direct A-share lookup failed for ${aShareSymbol}, falling through to search`);
            }
        }

        // 2. For Chinese text, try searching Yahoo Finance directly (no translation) first
        //    Yahoo Finance supports Chinese queries well and returns Chinese A-shares
        let searchQuery = query;
        let translatedQuery: string | null = null;

        if (/[\u4e00-\u9fa5]/.test(query)) {
            // Try to translate for fallback, but use original first
            try {
                const translated = await translate(query, { to: 'en' }) as any;
                if (translated.text && translated.text !== query) {
                    translatedQuery = translated.text;
                    console.log(`Translation ready: ${query} -> ${translatedQuery}`);
                }
            } catch (e) {
                console.warn("Query translation failed:", e);
            }
        }

        const trySearch = async (q: string) => {
            try {
                const res = await yahooFinance.search(q, {
                    quotesCount: 8,
                    newsCount: 0,
                    lang: lang,
                    // @ts-ignore
                    validation: { logErrors: false }
                }) as any;
                return res;
            } catch (e: any) {
                console.error('Yahoo Finance Search Error:', e.message);
                return null;
            }
        };

        // Try original query first (works well for Chinese company names & codes)
        let results = await trySearch(searchQuery);

        // If no A-share equity results, try translated query as fallback
        const hasEquity = results?.quotes?.some((q: any) =>
            q.quoteType === 'EQUITY' || q.quoteType === 'ETF'
        );
        if ((!results || !hasEquity) && translatedQuery) {
            console.log(`No results for "${searchQuery}", trying translated: "${translatedQuery}"`);
            results = await trySearch(translatedQuery);
        }

        if (!results?.quotes) {
            return NextResponse.json({ results: [] });
        }

        // Filter valid quotes
        const quotes = results.quotes.filter((q: any) =>
            q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'INDEX'
        );

        // Process translations in parallel
        const formatted = await Promise.all(quotes.map(async (quote: any) => {
            let name = quote.shortname || quote.longname || quote.symbol;

            // If user requested Chinese but name is ASCII, try to translate
            if (isChinese && name && /^[\x00-\x7F]+$/.test(name) && name !== quote.symbol) {
                try {
                    const res = await translate(name, { to: 'zh-CN' }) as any;
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
