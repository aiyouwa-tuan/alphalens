import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPortfolio } from '@/lib/db';
import { getQuotes } from '@/lib/price';

export async function GET() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const portfolio = await getPortfolio(userId);
    const symbols = portfolio.holdings.map(h => h.symbol);

    // Fetch latest prices
    const quotes = await getQuotes(symbols);

    // Calculate Enriched Data
    let totalEquity = 0;
    let totalUnrealizedPL = 0;

    const holdings = portfolio.holdings.map(h => {
        const quote = quotes[h.symbol];
        const currentPrice = quote?.price || 0;
        const changePercent = quote?.changePercent || 0;

        const marketValue = h.quantity * currentPrice;
        const costBasis = h.quantity * h.averageCost;
        const unrealizedPL = marketValue - costBasis;
        const unrealizedPLPercent = costBasis > 0 ? (unrealizedPL / costBasis) * 100 : 0;

        totalEquity += marketValue;
        totalUnrealizedPL += unrealizedPL;

        return {
            ...h,
            currentPrice,
            changePercent,
            marketValue,
            unrealizedPL,
            unrealizedPLPercent,
        };
    });

    const totalPL = portfolio.realizedPL + totalUnrealizedPL;

    return NextResponse.json({
        holdings,
        stats: {
            totalEquity,
            totalRealizedPL: portfolio.realizedPL,
            totalUnrealizedPL,
            totalPL,
        }
    });
}
