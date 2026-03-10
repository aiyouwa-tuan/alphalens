import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
// @ts-ignore
import translate from 'google-translate-api-x';

/**
 * Detect A-share ticker code and return the Yahoo Finance symbol with exchange suffix.
 * Shanghai: 6xxxxx, 9xxxxx → .SS
 * Shenzhen: 0xxxxx, 1xxxxx, 2xxxxx, 3xxxxx → .SZ
 */
function resolveAShareCode(query: string): string | null {
    const trimmed = query.trim();
    if (/^\d{6}$/.test(trimmed)) {
        const first = trimmed[0];
        if (first === '6' || first === '9') return `${trimmed}.SS`;
        if (['0', '1', '2', '3'].includes(first)) return `${trimmed}.SZ`;
    }
    return null;
}

async function searchYahoo(q: string, lang: string): Promise<any[]> {
    try {
        const results: any = await yahooFinance.search(q, {
            quotesCount: 8,
            newsCount: 0,
            lang: lang,
            // @ts-ignore
            validation: { logErrors: false },
        });
        return results?.quotes ?? [];
    } catch (e: any) {
        console.error('Yahoo Finance Search Error:', e.message);
        return [];
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q');
    const lang = searchParams.get('lang') || 'en-US';
    const isChinese = lang.startsWith('zh');

    if (!rawQuery) {
        return NextResponse.json({ results: [] });
    }

    try {
        // 1. If input is a 6-digit A-share code, search with the exchange suffix directly
        const aShareSymbol = resolveAShareCode(rawQuery);
        const primaryQuery = aShareSymbol ?? rawQuery;

        // 2. For Chinese text, try searching Yahoo Finance directly (no translation) first.
        //    Yahoo Finance supports Chinese company name searches natively.
        let quotes = await searchYahoo(primaryQuery, lang);

        // 3. If no equity found and query had Chinese characters, try English translation as fallback
        const hasEquity = quotes.some((q: any) =>
            q.quoteType === 'EQUITY' || q.quoteType === 'ETF'
        );
        if (!hasEquity && /[\u4e00-\u9fa5]/.test(rawQuery)) {
            try {
                const translated = await translate(rawQuery, { to: 'en' }) as any;
                if (translated?.text && translated.text !== rawQuery) {
                    console.log(`Fallback translate: ${rawQuery} -> ${translated.text}`);
                    const fallbackQuotes = await searchYahoo(translated.text, lang);
                    if (fallbackQuotes.length > 0) quotes = fallbackQuotes;
                }
            } catch (e) {
                console.warn('Translation fallback failed:', e);
            }
        }

        // Filter to valid quote types
        const filtered = quotes.filter((q: any) =>
            q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'INDEX'
        );

        // Process name translations in parallel
        const formatted = await Promise.all(filtered.map(async (quote: any) => {
            let name: string = quote.shortname || quote.longname || quote.symbol;

            // Translate ASCII company names to Chinese if user is in Chinese mode
            if (isChinese && name && /^[\x00-\x7F]+$/.test(name) && name !== quote.symbol) {
                try {
                    const res = await translate(name, { to: 'zh-CN' }) as any;
                    if (res?.text && res.text !== name) name = res.text;
                } catch (e) {
                    // keep original name
                }
            }

            return {
                symbol: quote.symbol,
                name,
                type: quote.quoteType,
                exchange: quote.exchange,
            };
        }));

        return NextResponse.json({ results: formatted });
    } catch (error) {
        console.error('Search API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch search results' }, { status: 500 });
    }
}
