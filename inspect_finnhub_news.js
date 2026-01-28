const fs = require('fs');
const https = require('https');
const path = require('path');

// Read .env.local to get the key
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/FINNHUB_API_KEY=(.+)/);
const apiKey = match ? match[1] : '';

if (!apiKey) {
    console.error("No API Key found!");
    process.exit(1);
}

const symbol = 'AAPL';
const today = new Date().toISOString().split('T')[0];
// Get news from the last 3 days
const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];

const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${threeDaysAgo}&to=${today}&token=${apiKey}`;

console.log(`Fetching Finnhub news for ${symbol}...`);

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const news = JSON.parse(data);
            console.log(`Found ${news.length} articles.`);
            news.slice(0, 3).forEach((item, i) => {
                console.log(`\n[${i + 1}] ${item.headline}`);
                console.log(`Summary: ${item.summary.substring(0, 100)}...`);
                console.log(`Date: ${new Date(item.datetime * 1000).toLocaleString()}`);
                console.log(`Image: ${item.image}`);
            });
        } catch (e) {
            console.error("Parse error:", e);
        }
    });
}).on('error', (e) => {
    console.error("Request error:", e);
});
