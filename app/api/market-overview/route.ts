import { NextResponse } from 'next/server';
import { getQuotes } from '@/lib/price';

export const dynamic = 'force-dynamic';

const MARKET_SYMBOLS = [
    'SPY', 'QQQ',
    'AAPL', 'MSFT', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA'
];

export async function GET() {
    try {
        const data = await getQuotes(MARKET_SYMBOLS);
        return NextResponse.json({
            indices: [
                { symbol: 'SPY', ...data['SPY'] },
                { symbol: 'QQQ', ...data['QQQ'] }
            ],
            m7: [
                { symbol: 'AAPL', ...data['AAPL'] },
                { symbol: 'MSFT', ...data['MSFT'] },
                { symbol: 'GOOG', ...data['GOOG'] },
                { symbol: 'AMZN', ...data['AMZN'] },
                { symbol: 'NVDA', ...data['NVDA'] },
                { symbol: 'META', ...data['META'] },
                { symbol: 'TSLA', ...data['TSLA'] }
            ]
        });
    } catch (error) {
        console.error('Failed to fetch market overview', error);
        return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
    }
}
