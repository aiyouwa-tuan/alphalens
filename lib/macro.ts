import yahooFinance from 'yahoo-finance2';

const FRED_API_KEY = process.env.FRED_API_KEY;

export interface MacroQuote {
    symbol: string;
    shortName: string;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
    source?: 'FRED' | 'Yahoo';
}

async function fetchFredSeries(seriesId: string): Promise<number | null> {
    if (!FRED_API_KEY) return null;
    try {
        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.observations && data.observations.length > 0) {
            return parseFloat(data.observations[0].value);
        }
    } catch (e) {
        console.warn(`FRED Fetch Error (${seriesId}):`, e);
    }
    return null;
}

export async function fetchMacroIndicators(symbols: string[]): Promise<MacroQuote[]> {
    // Separate FRED symbols from Yahoo symbols
    // FRED Series IDs: DGS10 (10Y Yield), DGS2 (2Y), FEDFUNDS (Rates) => Map standard symbols to FRED

    // Mapping: ^TNX -> DGS10

    const results: MacroQuote[] = [];

    // Parallel fetch
    await Promise.all(symbols.map(async (sym) => {
        let price = 0;
        let change = 0;
        let name = sym;
        let source: 'FRED' | 'Yahoo' = 'Yahoo';

        // Try FRED for Yields
        if (sym === '^TNX' && FRED_API_KEY) {
            const fredPrice = await fetchFredSeries('DGS10'); // 10-Year Treasury Constant Maturity Rate
            if (fredPrice !== null) {
                price = fredPrice;
                name = '10Y Yield (FRED)';
                source = 'FRED';
                // Calculate pseudo-change? FRED doesn't give daily change easily without fetching 2 points.
                // Fetch previous day for change
                // For MVP, just show price.
            }
        }

        if (source === 'Yahoo') {
            try {
                const quote = await yahooFinance.quote(sym) as any;
                price = quote.regularMarketPrice || 0;
                change = quote.regularMarketChangePercent || 0;
                name = quote.shortName || sym;
            } catch (e) {
                console.warn(`Yahoo Macro Error (${sym}):`, e);
            }
        }

        results.push({
            symbol: sym,
            shortName: name,
            regularMarketPrice: price,
            regularMarketChangePercent: change,
            source
        });
    }));

    return results;
}
