export interface CryptoData {
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    price_change_percentage_24h: number;
    last_updated: string;
}

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

export async function fetchCryptoPrices(ids: string[]) {
    try {
        // Use Pro/Demo API endpoint if key exists (Note: Pro uses specific URL, Demo uses header)
        // Assume standard endpoint with header for "Demo API Key"
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24h_change=true`;

        const headers: HeadersInit = {
            'Accept': 'application/json',
        };

        if (COINGECKO_API_KEY) {
            headers['x-cg-demo-api-key'] = COINGECKO_API_KEY;
        }

        const res = await fetch(url, {
            headers,
            next: { revalidate: 60 }
        });

        if (!res.ok) throw new Error(`CoinGecko Error: ${res.status}`);
        return await res.json();
    } catch (error) {
        console.error('Error fetching crypto prices:', error);
        return {};
    }
}
