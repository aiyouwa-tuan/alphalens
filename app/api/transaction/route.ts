import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { getPortfolio, savePortfolio, saveTransaction } from '@/lib/db';
import { TransactionType } from '@/lib/types';

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { symbol, type, quantity, price, date } = body;

        if (!symbol || !type || !quantity || !price || !date) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const txQuantity = Number(quantity);
        const txPrice = Number(price);
        const txType = type as TransactionType;

        // 1. Save Transaction Record
        await saveTransaction({
            id: uuidv4(),
            userId,
            symbol,
            type: txType,
            quantity: txQuantity,
            price: txPrice,
            date,
        });

        // 2. Update Portfolio
        const portfolio = await getPortfolio(userId);
        const holdingIndex = portfolio.holdings.findIndex(h => h.symbol === symbol);

        if (holdingIndex === -1) {
            if (txType === 'SELL') {
                return NextResponse.json({ error: 'Cannot sell stock you do not own' }, { status: 400 });
            }
            // New Holding
            portfolio.holdings.push({
                symbol,
                quantity: txQuantity,
                averageCost: txPrice,
            });
        } else {
            const holding = portfolio.holdings[holdingIndex];

            if (txType === 'BUY') {
                // Weighted Average Cost
                const totalCost = (holding.quantity * holding.averageCost) + (txQuantity * txPrice);
                const newQuantity = holding.quantity + txQuantity;
                holding.averageCost = totalCost / newQuantity;
                holding.quantity = newQuantity;
            } else {
                // SELL
                if (holding.quantity < txQuantity) {
                    return NextResponse.json({ error: 'Insufficient quantity to sell' }, { status: 400 });
                }
                // Calculate Realized P/L
                // Profit = (Sell Price - Avg Cost) * Sold Qty
                const profit = (txPrice - holding.averageCost) * txQuantity;
                portfolio.realizedPL = (portfolio.realizedPL || 0) + profit; // Ensure it's initialized

                holding.quantity -= txQuantity;
                if (holding.quantity === 0) {
                    portfolio.holdings.splice(holdingIndex, 1);
                }
            }
        }

        await savePortfolio(portfolio);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Transaction error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
