const yf = require('yahoo-finance2');

async function test() {
    try {
        const YahooFinance = yf.default;
        const yahooFinance = new YahooFinance();
        const quote = await yahooFinance.quote('NVDA');
        console.log('SUCCESS! Price:', quote?.regularMarketPrice);
    } catch (e) {
        console.log('Instantiation failed:', e.message);
    }
}

test();
