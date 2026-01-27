const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env.local to get the key
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/FINNHUB_API_KEY=(.+)/);
const apiKey = match ? match[1].trim() : null;

if (!apiKey) {
    console.error('No FINNHUB_API_KEY found in .env.local');
    process.exit(1);
}

const symbols = ['NVDA', 'SPY', 'QQQ', '^GSPC'];

symbols.forEach(symbol => {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;

    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log(`\n--- ${symbol} ---`);
            try {
                const json = JSON.parse(data);
                console.log(JSON.stringify(json, null, 2));
            } catch (e) {
                console.log('Raw:', data);
            }
        });
    }).on('error', (err) => {
        console.error(`Error fetching ${symbol}:`, err.message);
    });
});
