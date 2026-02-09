import yahooFinance from 'yahoo-finance2';

export interface MacroQuote {
    symbol: string;
    shortName: string;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
}

export async function fetchMacroIndicators(symbols: string[]): Promise<MacroQuote[]> {
    try {
        const quotes = await yahooFinance.quote(symbols, { return: 'array' }) as any[];

        return quotes.map((q: any) => ({
            symbol: q.symbol,
            shortName: q.shortName || q.symbol,
            regularMarketPrice: q.regularMarketPrice || 0,
            regularMarketChangePercent: q.regularMarketChangePercent || 0,
        }));
    } catch (error) {
        console.error('Error fetching macro indicators:', error);
        // Return empty or fallback? better to return empty and handle in UI
        return [];
    }
}
