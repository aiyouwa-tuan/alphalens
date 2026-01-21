import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '@/lib/db';
import { getQuotes } from '@/lib/price';

export const dynamic = 'force-dynamic';

async function getUser() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId) return null;
    return { id: userId };
}

export async function GET() {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const symbols = await getWatchlist(user.id);
        const quotes = await getQuotes(symbols);

        // Merge into list
        const data = symbols.map(sym => ({
            symbol: sym,
            ...(quotes[sym] || { price: 0, change: 0, changePercent: 0 })
        }));

        return NextResponse.json(data);
    } catch (error) {
        console.error('Watchlist GET error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { symbol } = body;

        if (!symbol) {
            return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
        }

        await addToWatchlist(user.id, symbol);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Watchlist POST error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol');

        if (!symbol) {
            return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
        }

        await removeFromWatchlist(user.id, symbol);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Watchlist DELETE error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
