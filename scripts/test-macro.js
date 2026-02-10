
const pkg = require('yahoo-finance2');
// Try to find the class constructor
const YahooFinance = pkg.YahooFinance || pkg.default?.YahooFinance;

async function testFetch() {
    console.log('Package keys:', Object.keys(pkg));
    if (pkg.default) console.log('Default keys:', Object.keys(pkg.default));

    try {
        const yahooFinance = new YahooFinance();
        const symbols = ['^TNX', 'CL=F', 'GC=F', '^VIX', 'DX-Y.NYB'];
        console.log('Testing Yahoo Finance Fetch (Instance) for:', symbols);

        for (const sym of symbols) {
            try {
                const quote = await yahooFinance.quote(sym);
                console.log(`[SUCCESS] ${sym}:`, quote.regularMarketPrice);
            } catch (e) {
                console.error(`[FAILURE] ${sym}:`, e.message);
            }
        }
    } catch (e) {
        console.error("Instantiation failed:", e);
        // Fallback: maybe just require('yahoo-finance2').default IS the instance but needs something else?
        // The error "Call const yahooFinance = new YahooFinance() first" implies we need to instantiate.
    }
}

testFetch();
