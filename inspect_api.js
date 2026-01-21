// Native fetch is available in Node 21+

const API_KEY = '18jCoD0zxuGLuXIrkQzxeMwKiu2jj7UI';
const TEMPLATE = 'https://api.massive.com/1.0/stock/{ticker}/quote';

async function test() {
    const symbol = 'NVDA';
    let url = TEMPLATE.replace('{ticker}', symbol);
    url += `?apikey=${API_KEY}`;

    console.log(`Fetching: ${url}`);

    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status}`);

        if (res.ok) {
            const data = await res.json();
            console.log('Response Body:', JSON.stringify(data, null, 2));
        } else {
            const txt = await res.text();
            console.log('Error Body:', txt);
        }
    } catch (e) {
        console.error('Fetch failed:', e);
    }
}

test();
