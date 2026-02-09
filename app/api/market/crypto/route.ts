import { NextResponse } from 'next/server';
import { fetchCryptoPrices } from '@/lib/crypto';
import { CRYPTO_IDS } from '@/lib/config_sources';

export async function GET() {
    const data = await fetchCryptoPrices(CRYPTO_IDS);
    return NextResponse.json(data);
}
