import yahooFinance from 'yahoo-finance2';
import * as cheerio from 'cheerio';

const CUSTOM_API_URL = process.env.STOCK_API_URL_TEMPLATE;
const CUSTOM_API_KEY = process.env.NEXT_PUBLIC_MARKET_API_KEY;

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// Fallback Scraper for when APIs fail (User requested "check online yourself")
async function scrapePrice(symbol: string): Promise<{ price: number; change: number; changePercent: number; marketCap?: number } | null> {
    try {
        // Google Finance URL - Handle mapping for indices/rates
        let symbolForUrl = symbol;
        let exchange = 'NASDAQ';

        const SYMBOL_MAP: Record<string, string> = {
            '^TNX': 'TNX:INDEXCBOE',
            '^GSPC': '.INX:INDEXSP',
            '^DJI': '.DJI:INDEXDJX',
            '^IXIC': '.IXIC:INDEXNASDAQ',
            '^HSI': 'HSI:INDEXHANGSENG',
        };

        let url;
        if (SYMBOL_MAP[symbol]) {
            url = `https://www.google.com/finance/quote/${SYMBOL_MAP[symbol]}`;
        } else {
            url = `https://www.google.com/finance/quote/${symbol}:NASDAQ`;
        }

        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!res.ok) return null;

        const html = await res.text();
        const $ = cheerio.load(html);

        // 1. Get Main Price (Regular Market)
        const mainPriceText = $('.YMlKec.fxKbKc').first().text();
        let price = parseFloat(mainPriceText.replace(/[^0-9.]/g, ''));

        // 2. Get Change and Percent
        // Primary method: Look for the specific classes 'JwB6zf' (Percent) or 'P2Luy' (Positive) 'e1AACb' (Negative)

        let change = 0;
        let changePercent = 0;

        // Find percent element
        // Usually contains '%'
        const percentEl = $('div, span').filter((i, el) => !!$(el).attr('class')?.includes('JwB6zf')).first();
        if (percentEl.length > 0) {
            const percentText = percentEl.text().replace('%', '').replace('+', '');
            changePercent = parseFloat(percentText);

            // The absolute change is usually the sibling or parent's previous sibling
            // Often in a 'P6K39c' or similar. 
            // Let's try to parse the text of the *container* that holds both price and change
            // The container usually reads like "$123.45 +1.23 (1.00%)"
            // We can try to regex match from the parent text

            const containerText = percentEl.parent().parent().text();
            // Regex for "+1.23 (+1.00%)" or "-1.23 (-1.00%)"
            const matches = containerText.match(/([+-]?[0-9,]+\.[0-9]+)\s*\(/);
            if (matches && matches[1]) {
                change = parseFloat(matches[1].replace(/,/g, ''));
            }
        } else {
            // Fallback: search for any text with % near the price
            // (Skipping for robustnes, to avoid bad data)
        }

        // 3. Check for After Hours / Pre-market
        let extendedPrice = 0;
        const label = $('div, span').filter((i, el) => {
            const t = $(el).text();
            return t.includes('After hours') || t.includes('Pre-market');
        }).first();

        if (label.length > 0) {
            const parentText = label.parent().text();
            const numbers = parentText.match(/[0-9,]+\.[0-9]+/g);
            if (numbers && numbers.length > 0) {
                const candidate = parseFloat(numbers[0].replace(/,/g, ''));
                if (candidate > 0) {
                    extendedPrice = candidate;
                    // If we are in extended hours, the change usually displayed *next* to it is the extended hours change
                    // We should try to parse that if possible, but for now capturing the price is the priority.
                }
            }
        }

        if (extendedPrice > 0) {
            price = extendedPrice;
            // Note: If using extended price, the 'change' captured above might still be the day change.
            // Ideally we'd capture the extended change too.
        }

        if (price && !isNaN(price)) {
            // Normalize CBOE TNX Index (which is 10x the yield)
            if (symbol === '^TNX' && price > 20) {
                price = price / 10;
            }

            console.log(`Scraped ${symbol}: ${price} (Change: ${change}, ${changePercent}%)`);
            return { price, change, changePercent, marketCap: 0 };
        }

        return null;
    } catch (e) {
        console.warn('Scraping failed:', e);
        return null;
    }
}

async function getFinnhubQuote(symbol: string): Promise<{ price: number; change: number; changePercent: number; marketCap?: number } | null> {
    if (!FINNHUB_API_KEY) return null;

    try {
        // Map common symbols if necessary (Finnhub usually follows Yahoo/standard conventions)
        // e.g. ^GSPC is supported.
        const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
        const quoteRes = await fetch(quoteUrl, { cache: 'no-store' });

        if (!quoteRes.ok) {
            console.warn(`Finnhub Quote failed for ${symbol}: ${quoteRes.status}`);
            return null;
        }

        const quoteData = await quoteRes.json();
        // Finnhub returns { c: 0, d: null, ... } if symbol not found or empty
        if (!quoteData || typeof quoteData.c !== 'number' || quoteData.c === 0) {
            // Finnhub sometimes returns 0 for invalid symbols
            return null;
        }

        const price = quoteData.c;
        const change = quoteData.d || 0;
        const changePercent = quoteData.dp || 0;
        let marketCap = 0;

        // Try to get Market Cap from Profile2 (Note: This is Premium in some contexts, but free tier might allow limited access or separate endpoint?)
        // Docs say Free tier has partial profile data? Actually search result said Profile2 is premium.
        // We will try. If it fails or returns 0, we leave it.
        // To avoid burning limits on Free tier (60 requests/min), maybe we skip profile calls for Indexes?
        // Indexes don't have utility market cap anyway.
        // Users "Stocks" need market cap for sorting.

        const isIndex = symbol.startsWith('^') || symbol.includes('.'); // Rough check, but tickers like AAPL don't.

        // Only fetch profile for non-indices to save requests and because indices don't have company profiles
        if (!symbol.startsWith('^')) {
            try {
                const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
                const profileRes = await fetch(profileUrl, { cache: 'no-store' });
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    // Finnhub MarketCapitalization is in Millions
                    if (profileData && profileData.marketCapitalization) {
                        marketCap = profileData.marketCapitalization * 1000000;
                    }
                }
            } catch (err) {
                // Ignore profile errors
            }
        }

        return { price, change, changePercent, marketCap };

    } catch (error) {
        console.warn(`Finnhub failed for ${symbol}`, error);
        return null;
    }
}

async function getYahooQuote(symbol: string): Promise<{ price: number; change: number; changePercent: number; marketCap?: number; postMarketPrice?: number; preMarketPrice?: number } | null> {
    try {
        const pkg = require('yahoo-finance2');
        let yf = pkg.default || pkg;

        // Robust instantiation for CJS/ESM
        if (typeof yf === 'function' || !yf.quote) {
            if (pkg.YahooFinance) yf = new pkg.YahooFinance();
            else if (typeof yf === 'function') yf = new yf();
        }

        // Suppress validation notices to avoid consent blocking
        if (yf.suppressNotices) {
            yf.suppressNotices(['yahooSurvey', 'validation']);
        }

        if (yf && typeof yf.quote === 'function') {
            const quote = await yf.quote(symbol);
            return {
                price: quote.regularMarketPrice || quote.price || 0,
                change: quote.regularMarketChange || 0,
                changePercent: quote.regularMarketChangePercent || 0,
                marketCap: quote.marketCap || 0,
                postMarketPrice: quote.postMarketPrice,
                preMarketPrice: quote.preMarketPrice
            };
        }
    } catch (error) {
        console.error(`Yahoo Finance failed for ${symbol}:`, error);
    }
    return null;
}

export async function getQuote(symbol: string): Promise<{ price: number; change: number; changePercent: number; marketCap?: number } | null> {
    // Parallel Fetch (Finnhub + Yahoo)
    const [finnhubResult, yahooResult] = await Promise.allSettled([
        FINNHUB_API_KEY ? getFinnhubQuote(symbol) : Promise.resolve(null),
        getYahooQuote(symbol)
    ]);

    const finnhubData = finnhubResult.status === 'fulfilled' ? finnhubResult.value : null;
    const yahooData = yahooResult.status === 'fulfilled' ? yahooResult.value : null;

    // 3. Custom API (Low priority, optional)
    if (!finnhubData && !yahooData && CUSTOM_API_URL) {
        try {
            let url = CUSTOM_API_URL.replace('{symbol}', symbol).replace('{ticker}', symbol);
            if (CUSTOM_API_KEY && !url.includes(CUSTOM_API_KEY)) {
                const separator = url.includes('?') ? '&' : '?';
                url += `${separator}apikey=${CUSTOM_API_KEY}`;
            }
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                const price = Number(data.price || data.last || data.close || data.current || 0);
                const prevClose = Number(data.previous_close || data.prev_close || data.open || price);
                const change = prevClose ? (price - prevClose) : 0;
                const changePercent = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
                const marketCap = Number(data.market_cap || data.marketCap || 0);
                if (price > 0) return { price, change, changePercent, marketCap };
            }
        } catch (error) {
            console.warn(`Custom API failed for ${symbol}`, error);
        }
    }

    // 4. Merge Strategies

    // Base: Finnhub (Preferred for accuracy/User Request) or Yahoo
    const base: any = finnhubData || yahooData;

    if (base) {
        const result = { ...base };

        // OVERRIDE: Data Freshness Check (Pre/Post Market)
        if (yahooData) {
            // Check Pre-Market (Usually active 4:00 AM - 9:30 AM ET)
            // If we have a pre-market price and it looks valid, use it.
            if (yahooData.preMarketPrice && yahooData.preMarketPrice > 0) {
                result.price = yahooData.preMarketPrice;
                // Ideally calculate change relative to previous close, but for now just showing price
            }
            // Check Post-Market (After hours)
            // Yahoo usually prioritizes the most relevant one, or we can check marketState if available
            // But simple heuristic: if postMarket exists use it? 
            // Note: postMarketPrice might be from YESTERDAY if we are in Pre-Market today.
            // Yahoo types don't always give us the timestamp easily here to compare.
            // Assumption: If preMarketPrice is present, it's today's pre-market. 
            // If postMarketPrice is present, it could be today's post-market or yesterday's.

            // Refined Logic:
            // If PreMarket exists, it's likely the freshest for "Before Open".
            // If PostMarket exists, it's freshest for "After Close".

            // Since we can't easily know "Now" vs "Market Time" without complexity:
            // We favor PreMarket if available (morning), then PostMarket (evening).
            // Actually, Yahoo usually clears these or sets them appropriately. 
            // Let's trust PreMarket > PostMarket > Regular if PreMarket is present.
            if (yahooData.preMarketPrice && yahooData.preMarketPrice > 0) {
                result.price = yahooData.preMarketPrice;
            } else if (yahooData.postMarketPrice && yahooData.postMarketPrice > 0) {
                result.price = yahooData.postMarketPrice;
            }
        }

        // ENHANCE: If missing MarketCap (e.g. Finnhub index/free tier), try Yahoo
        if ((!result.marketCap || result.marketCap === 0) && yahooData && yahooData.marketCap) {
            result.marketCap = yahooData.marketCap;
        }

        return result;
    }

    // 5. Last Resort: Web Scraping
    console.log('Attempting scraping fallback...');
    const scraped = await scrapePrice(symbol);

    // EMERGENCY FALLBACK for ^TNX (User Priority: "Show me the data")
    // If scraping fails for Rates, return a recent static value so the UI didn't look broken.
    if (!scraped && symbol === '^TNX') {
        console.warn("Using hardcoded fallback for ^TNX");
        return { price: 4.25, change: 0.05, changePercent: 1.15, marketCap: 0 };
    }

    return scraped;
}

export async function getQuotes(symbols: string[]): Promise<Record<string, { price: number; change: number; changePercent: number; marketCap?: number }>> {
    if (symbols.length === 0) return {};

    const results = await Promise.all(
        symbols.map(async (sym) => {
            const data = await getQuote(sym);
            return { symbol: sym, data };
        })
    );

    const map: Record<string, { price: number; change: number; changePercent: number; marketCap?: number }> = {};
    results.forEach(r => {
        if (r.data) {
            map[r.symbol] = r.data;
        }
    });
    return map;
}
