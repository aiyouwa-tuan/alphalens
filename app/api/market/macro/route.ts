import { NextResponse } from 'next/server';
import { fetchMacroIndicators } from '@/lib/macro'; // Check lib/macro.ts... "export async function fetchMacroIndicators" - Correct.
// Wait, lib/macro.ts import yahooFinance might fail if not installed? 
// package.json had "yahoo-finance2": "^3.11.2", so it should be fine.
import { MACRO_SYMBOLS } from '@/lib/config_sources';

export async function GET() {
    const symbols = MACRO_SYMBOLS.map(s => s.symbol);
    const data = await fetchMacroIndicators(symbols);
    return NextResponse.json(data);
}
