const yf = require('yahoo-finance2');

async function test() {
    console.log('Type of yf:', typeof yf);
    console.log('Keys of yf:', Object.keys(yf));

    if (yf.default) {
        console.log('Type of yf.default:', typeof yf.default);
        console.log('Keys of yf.default:', Object.keys(yf.default));
    }

    try {
        const quote = await yf.quote('NVDA');
        console.log('Quote via yf.quote:', quote?.regularMarketPrice);
    } catch (e) {
        console.log('yf.quote failed:', e.message);
    }

    try {
        const quote = await yf.default.quote('NVDA');
        console.log('Quote via yf.default.quote:', quote?.regularMarketPrice);
    } catch (e) {
        console.log('yf.default.quote failed:', e.message);
    }
}

test();
