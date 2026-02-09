export interface CryptoData {
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    price_change_percentage_24h: number;
    last_updated: string;
}

export async function fetchCryptoPrices(ids: string[]): Promise<CryptoData[]> {
    try {
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(',')}&order=market_cap_desc&per_page=10&page=1&sparkline=false`,
            { next: { revalidate: 60 } } // Cache for 1 min
        );

        if (!response.ok) {
            throw new Error('Failed to fetch from CoinGecko');
        }

        const data = await response.json();
        return data as CryptoData[];
    } catch (error) {
        console.error('Error fetching crypto prices:', error);
        return [];
    }
}
