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
            '^TNX',
            'GC=F', 'BTC-USD'
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
            commodities: [
                { symbol: 'Gold', ...data['GC=F'], change: data['GC=F']?.change || 0, changePercent: data['GC=F']?.changePercent || 0, price: data['GC=F']?.price || 0, lastUpdated: data['GC=F']?.lastUpdated },
                { symbol: 'BTC', ...data['BTC-USD'], change: data['BTC-USD']?.change || 0, changePercent: data['BTC-USD']?.changePercent || 0, price: data['BTC-USD']?.price || 0, lastUpdated: data['BTC-USD']?.lastUpdated }
            ],
            etfs: etfData,
            stocks: sortedStocks,
            rates: [
                { symbol: '^TNX', name: 'US 10Y', ...data['^TNX'] }
            ]
        });
    } catch (error) {
        console.error('Failed to fetch market overview', error);
        return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
    }
}
