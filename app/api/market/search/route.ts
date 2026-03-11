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

// 常见热门中概股、A股、港股映射表（O(1) 极速拦截）
const COMMON_CHINESE_STOCKS: Record<string, string> = {
    '宁德时代': '300750.SZ',
    '腾讯': '0700.HK',
    '腾讯控股': '0700.HK',
    '阿里': 'BABA',
    '阿里巴巴': 'BABA',
    '美团': '3690.HK',
    '比亚迪': '002594.SZ',
    '茅台': '600519.SS',
    '贵州茅台': '600519.SS',
    '拼多多': 'PDD',
    '京东': 'JD',
    '网易': 'NTES',
    '百度': 'BIDU',
    '小米': '1810.HK',
    '理想': 'LI',
    '蔚来': 'NIO',
    '小鹏': 'XPEV',
    '隆基': '601012.SS',
    '隆基绿能': '601012.SS',
    '五粮液': '000858.SZ',
    '东方财富': '300059.SZ',
    '工商银行': '601398.SS',
    '招商银行': '600036.SS',
    '迈瑞医疗': '300760.SZ',
    '立讯精密': '002475.SZ',
    '美的': '000333.SZ',
    '美的集团': '000333.SZ',
    '恒瑞医药': '600276.SS',
    '苹果': 'AAPL',
    '英伟达': 'NVDA',
    '特斯拉': 'TSLA',
    '微软': 'MSFT',
    '谷歌': 'GOOGL',
    '亚马逊': 'AMZN',
    '脸书': 'META'
};

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
        // 0. Pre-check common Chinese stocks (O(1) resolution)
        const commonMatch = COMMON_CHINESE_STOCKS[rawQuery.trim()];
        if (commonMatch) {
            console.log(`[Fast Match] ${rawQuery} -> ${commonMatch}`);
            return NextResponse.json({
                results: [{
                    symbol: commonMatch,
                    name: rawQuery,
                    type: 'EQUITY',
                    exchange: 'Auto'
                }]
            });
        }

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
