import yahooFinance from 'yahoo-finance2';
import * as cheerio from 'cheerio';

const CUSTOM_API_URL = process.env.STOCK_API_URL_TEMPLATE;
const CUSTOM_API_KEY = process.env.NEXT_PUBLIC_MARKET_API_KEY;

// Fallback Scraper for when APIs fail (User requested "check online yourself")
async function scrapePrice(symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
    try {
        // Google Finance URL - Try NASDAQ first, then NYSE if needed (simple logic for now)
        const url = `https://www.google.com/finance/quote/${symbol}:NASDAQ`;

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
            console.log(`Scraped ${symbol}: ${price} (Change: ${change}, ${changePercent}%)`);
            return { price, change, changePercent };
        }

        return null;
    } catch (e) {
        console.warn('Scraping failed:', e);
        return null;
    }
}

export async function getQuote(symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
    // 1. Try Custom API if configured
    if (CUSTOM_API_URL) {
        try {
            let url = CUSTOM_API_URL.replace('{symbol}', symbol).replace('{ticker}', symbol);
            if (CUSTOM_API_KEY && !url.includes(CUSTOM_API_KEY)) {
                const separator = url.includes('?') ? '&' : '?';
                url += `${separator}apikey=${CUSTOM_API_KEY}`;
            }

            console.log(`Fetching from Custom API: ${url}`);
            const res = await fetch(url);

            if (!res.ok) {
                console.warn(`Custom API status ${res.status}`);
            } else {
                const data = await res.json();
                const price = Number(data.price || data.last || data.close || data.current || 0);
                const prevClose = Number(data.previous_close || data.previousClose || data.prev_close || data.open || price);
                // Calculate change if possible, otherwise 0
                const change = prevClose ? (price - prevClose) : 0;
                const changePercent = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
                if (price > 0) return { price, change, changePercent };
            }
        } catch (error) {
            console.warn(`Custom API failed for ${symbol}`, error);
        }
    }

    // 2. Fallback to Yahoo Finance (Library)
    try {
        const pkg = require('yahoo-finance2');
        let yf = pkg.default || pkg;
        if (typeof yf === 'function' || !yf.quote) {
            if (pkg.YahooFinance) yf = new pkg.YahooFinance();
            else if (typeof yf === 'function') yf = new yf();
        }

        if (yf && typeof yf.quote === 'function') {
            const quote = await yf.quote(symbol);
            return {
                price: quote.regularMarketPrice || quote.price || 0,
                change: quote.regularMarketChange || 0,
                changePercent: quote.regularMarketChangePercent || 0,
            };
        }
    } catch (error) {
        console.error(`Yahoo Finance failed for ${symbol}:`, error);
    }

    // 3. Fallback: Web Scraping
    console.log('Attempting scraping fallback...');
    return await scrapePrice(symbol);
}

export async function getQuotes(symbols: string[]): Promise<Record<string, { price: number; change: number; changePercent: number }>> {
    if (symbols.length === 0) return {};

    const results = await Promise.all(
        symbols.map(async (sym) => {
            const data = await getQuote(sym);
            return { symbol: sym, data };
        })
    );

    const map: Record<string, { price: number; change: number; changePercent: number }> = {};
    results.forEach(r => {
        if (r.data) {
            map[r.symbol] = r.data;
        }
    });
    return map;
}
