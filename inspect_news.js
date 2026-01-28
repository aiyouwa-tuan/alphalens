const yahooFinance = require('yahoo-finance2').default; // This is usually correct for CJS but let's try just the module if that fails.
// Actually, looking at the error, it says "new YahooFinance() first". 
// But commonly we use the singleton. Let's try to match how I use it in lib/price.ts
// In lib/price.ts: import yahooFinance from 'yahoo-finance2'; 
// In CommonJS: 
const yf = require('yahoo-finance2').default;

async function getNews() {
    try {
        console.log("Fetching news for AAPL...");
        // In yahoo-finance2, search often returns news. 
        // Or we can try the explicit 'options' if available, but usually search(symbol, { newsCount: X }) works.
        const result = await yf.search('AAPL', { newsCount: 3 });

        console.log("--- News Results ---");
        if (result.news) {
            result.news.forEach((item, index) => {
                console.log(`\n[${index + 1}] ${item.title}`);
                console.log(`Link: ${item.link}`);
                console.log(`Publisher: ${item.publisher}`);
                console.log(`Time: ${new Date(item.providerPublishTime * 1000).toLocaleString()}`);
            });
        } else {
            console.log("No news found in search result.");
            console.log(JSON.stringify(result, null, 2));
        }

    } catch (error) {
        console.error("Error fetching news:", error);
    }
}

getNews();
