
import * as cheerio from 'cheerio';

async function scrapeGoogle(symbol: string) {
    try {
        const url = `https://www.google.com/finance/quote/${symbol}`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await res.text();
        const $ = cheerio.load(html);
        const priceText = $('.YMlKec.fxKbKc').first().text();
        return priceText;
    } catch (e: any) {
        return 'Error: ' + e.message;
    }
}

async function check() {
    console.log('--- DIAGNOSTIC ---');
    console.log('Fetching Google Finance Data...');
    const spx = await scrapeGoogle('.INX:INDEXSP');
    const dow = await scrapeGoogle('.DJI:INDEXDJX');
    const ndx = await await scrapeGoogle('.IXIC:INDEXNASDAQ'); // Nasdaq Composite
    const spy = await scrapeGoogle('SPY:NYSEARCA'); // SPY ETF

    console.log(`S&P 500 (Google): ${spx}`);
    console.log(`Dow Jones (Google): ${dow}`);
    console.log(`Nasdaq (Google): ${ndx}`);
    console.log(`SPY ETF (Google): ${spy}`);

    console.log('--- ANALYSIS ---');
    // Calculate Multiplier
    const spxVal = parseFloat(spx.replace(/,/g, ''));
    const spyVal = parseFloat(spy.replace(/,/g, ''));
    if (spyVal > 0) {
        console.log(`Implied Multiplier (S&P/SPY): ${spxVal / spyVal}`);
    }
    console.log('If S&P 500 is ~5900, then User "5011" is OLD or WRONG.');
    console.log('If S&P 500 is ~5011, then Market is CRASHING or Date is 2024.');
}

check();
