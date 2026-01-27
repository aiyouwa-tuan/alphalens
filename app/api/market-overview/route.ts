import { NextResponse } from 'next/server';
import { getQuotes } from '@/lib/price';

export const dynamic = 'force-dynamic';

const INDICES = {
    US: ['^DJI', '^IXIC', '^GSPC'],
    HK: ['^HSI', 'HSTECH.HK'],
    CN: ['000001.SS', '000300.SS', '399006.SZ']
};

const ETFS = ['SPY', 'QQQ'];

const STOCKS = [
    'NVDA', 'TSM', 'AAPL', 'MSFT', 'GOOG', 'AMZN', 'META', 'TSLA'
];

export async function GET() {
    try {
        const allSymbols = [
            ...INDICES.US,
            ...INDICES.HK,
            ...INDICES.CN,
            ...ETFS,
            ...STOCKS,
            '^TNX'
        ];

        const data = await getQuotes(allSymbols);

        // Sort stocks by market cap (descending)
        const sortedStocks = STOCKS.map(sym => ({ symbol: sym, ...data[sym] }))
            .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));

        const etfData = ETFS.map(sym => ({ symbol: sym, ...data[sym] }));

        return NextResponse.json({
            indices: {
                us: INDICES.US.map(sym => ({ symbol: sym, ...data[sym] })),
                hk: INDICES.HK.map(sym => ({ symbol: sym, ...data[sym] })),
                cn: INDICES.CN.map(sym => ({ symbol: sym, ...data[sym] }))
            },
            etfs: etfData,
            stocks: sortedStocks,
            rates: [
                { symbol: '^TNX', name: 'US 10Y Yield', ...data['^TNX'] }
            ]
        });
    } catch (error) {
        console.error('Failed to fetch market overview', error);
        return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
    }
}
