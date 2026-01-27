const pkg = require('yahoo-finance2');

(async () => {
    try {
        let yf = pkg.default || pkg;
        if (typeof yf === 'function' || !yf.quote) {
            if (pkg.YahooFinance) yf = new pkg.YahooFinance();
            else if (typeof yf === 'function') yf = new yf();
        }

        if (yf.suppressNotices) {
            yf.suppressNotices(['yahooSurvey', 'validation']);
        }

        console.log("Fetching ^DJI...");
        try {
            const quoteDJI = await yf.quote('^DJI');
            console.log('DJI Price:', quoteDJI.regularMarketPrice);
        } catch (e) { console.log("DJI Error:", e.message); }

        console.log("Fetching TNX (no caret)...");
        try {
            const quoteTNX = await yf.quote('TNX');
            console.log('TNX Price:', quoteTNX.regularMarketPrice);
        } catch (e) { console.log("TNX Error:", e.message); }

        console.log("Fetching ^TNX...");
        const quote = await yf.quote('^TNX');
        console.log('Regular:', quote.regularMarketPrice);
        console.log('Post Market:', quote.postMarketPrice);
        console.log('Pre Market:', quote.preMarketPrice);
        console.log('Market State:', quote.marketState);
    } catch (e) {
        console.error("Error fetching ^TNX:", e.message);
    }
})();
