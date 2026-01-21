import { NextResponse } from 'next/server';
import { getQuote } from '@/lib/price';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    const data = await getQuote(symbol);
    return NextResponse.json({ symbol, data });
}
