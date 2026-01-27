const https = require('https');
const fs = require('fs');
const path = require('path');

let apiKey = process.env.FINNHUB_API_KEY;

if (!apiKey) {
    try {
        const envPath = path.resolve(__dirname, '.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/FINNHUB_API_KEY=(.*)/);
        if (match && match[1]) {
            apiKey = match[1].trim();
        }
    } catch (e) {
        console.error("Could not read .env.local");
    }
}

if (!apiKey) {
    console.error("FINNHUB_API_KEY is missing");
    process.exit(1);
}

function search(query) {
    const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${apiKey}`;
    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log(`Results for "${query}":`);
                console.log(JSON.stringify(json, null, 2));
            } catch (e) {
                console.error("Error parsing JSON:", e.message);
                console.log("Raw:", data);
            }
        });
    }).on('error', (e) => {
        console.error("Error:", e.message);
    });
}

search('US10Y');
search('Bond');

