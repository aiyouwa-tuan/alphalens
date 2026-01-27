import { getQuote } from '@/lib/price';
import yahooFinance from 'yahoo-finance2';

export const dynamic = 'force-dynamic';

async function getRawFinnhub(symbol: string) {
    const key = process.env.FINNHUB_API_KEY;
    if (!key) return { error: 'No FINNHUB_API_KEY found in process.env' };
    try {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${key}`, { cache: 'no-store' });
        if (!res.ok) return { error: `Status ${res.status}` };
        return await res.json();
    } catch (e: any) {
        return { error: e.message };
    }
}

async function getRawYahoo(symbol: string) {
    try {
        const pkg = require('yahoo-finance2');
        let yf = pkg.default || pkg;
        if (typeof yf === 'function' || !yf.quote) {
            if (pkg.YahooFinance) yf = new pkg.YahooFinance();
            else if (typeof yf === 'function') yf = new yf();
        }

        const result = await yf.quote(symbol);
        return {
            price: result.regularMarketPrice,
            postMarket: result.postMarketPrice,
            preMarket: result.preMarketPrice,
            marketState: result.marketState
        };
    } catch (e: any) {
        console.error(e);
        return { error: e.message };
    }
}

export default async function FinnhubTestPage() {
    const symbols = ['NVDA', 'SPY', 'QQQ', 'AAPL', 'MSFT'];
    const apiKeyPresent = !!process.env.FINNHUB_API_KEY;
    const maskedKey = process.env.FINNHUB_API_KEY ? `${process.env.FINNHUB_API_KEY.slice(0, 4)}...${process.env.FINNHUB_API_KEY.slice(-4)}` : 'MISSING';

    const results = await Promise.all(symbols.map(async (sym) => {
        const appData = await getQuote(sym);
        const rawData = await getRawFinnhub(sym);
        const yahooData = await getRawYahoo(sym);
        return { symbol: sym, appData, rawData, yahooData };
    }));

    return (
        <div className="p-8 font-sans max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Finnhub API Integration Test</h1>

            <div className={`p-4 mb-6 rounded-md ${apiKeyPresent ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                <p className="font-semibold">API Key Status: <span className={apiKeyPresent ? 'text-green-700' : 'text-red-700'}>{apiKeyPresent ? 'Present' : 'Missing'}</span></p>
                <p className="text-sm text-gray-600 mt-1">Key: {maskedKey}</p>
                <p className="text-sm mt-2 font-medium">Note: Finnhub Free Tier often shows delayed/closing prices during Pre-Market hours. The App uses a hybrid approach (Finnhub + Yahoo) to get the freshest price.</p>
            </div>

            <div className="grid gap-8">
                {results.map(({ symbol, appData, rawData, yahooData }) => (
                    <div key={symbol} className="border rounded-lg shadow-sm p-6 bg-white">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2 flex justify-between items-center mr-4">
                            <span>{symbol}</span>
                            <span className="text-sm font-normal text-gray-500">Live Check</span>
                        </h2>

                        <div className="grid md:grid-cols-3 gap-6">
                            {/* 1. Finnhub */}
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2 border-b">Finnhub (Primary)</h3>
                                <pre className="bg-gray-50 p-4 rounded text-xs font-mono overflow-auto h-48 border">
                                    {JSON.stringify(rawData, null, 2)}
                                </pre>
                                <div className="mt-2 text-sm text-gray-600">
                                    <p><strong>Price (c):</strong> {rawData.c}</p>
                                    <p className="text-xs text-gray-400">Usually Last Close during Pre-Mkt</p>
                                </div>
                            </div>

                            {/* 2. Yahoo Logic */}
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2 border-b">Yahoo (Backup)</h3>
                                <pre className="bg-yellow-50 p-4 rounded text-xs font-mono overflow-auto h-48 border border-yellow-100">
                                    {JSON.stringify(yahooData, null, 2)}
                                </pre>
                                <div className="mt-2 text-sm text-gray-600">
                                    <p><strong>Pre-Market:</strong> {yahooData.preMarket || 'N/A'}</p>
                                    <p><strong>Post-Market:</strong> {yahooData.postMarket || 'N/A'}</p>
                                </div>
                            </div>

                            {/* 3. App Logic */}
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2 border-b">App Logic (Merged)</h3>
                                <pre className="bg-blue-50 p-4 rounded text-xs font-mono overflow-auto h-48 border border-blue-100">
                                    {JSON.stringify(appData, null, 2)}
                                </pre>
                                <div className="mt-2 text-sm text-gray-600">
                                    {appData ? (
                                        <>
                                            <p className="text-lg font-bold text-blue-700">${appData.price}</p>
                                            <div className="mt-2 space-y-1">
                                                {appData.price === rawData.c && <span className="block text-green-600 text-xs">Matches Finnhub</span>}
                                                {(appData.price === yahooData.preMarket) && <span className="block text-purple-600 font-bold text-xs">Matches Yahoo Pre-Market (Fresher)</span>}
                                                {(appData.price === yahooData.postMarket) && <span className="block text-purple-600 font-bold text-xs">Matches Yahoo Post-Market</span>}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-red-500">Failed to get quote</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
