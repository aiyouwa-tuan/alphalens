export const RSS_FEEDS = {
    finance: [
        { name: 'CNBC', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664' },
        { name: 'MarketWatch', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories' },
        { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex' },
    ],
    geopolitics: [
        { name: 'Dept of Defense', url: 'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=945&max=10' },
        { name: 'CSIS', url: 'https://www.csis.org/rss/all' },
        { name: 'Brookings', url: 'https://www.brookings.edu/feed/' },
    ],
    tech: [
        { name: 'Hacker News', url: 'https://news.ycombinator.com/rss' },
        { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
    ]
};

export const MACRO_SYMBOLS = [
    { symbol: '^TNX', name: '10Y Yield' },
    { symbol: 'CL=F', name: 'Crude Oil' },
    { symbol: 'GC=F', name: 'Gold' },
    { symbol: '^VIX', name: 'VIX' },
    { symbol: 'DX-Y.NYB', name: 'USD Index' },
];

export const CRYPTO_IDS = [
    'bitcoin',
    'ethereum',
    'solana'
];

export const EXPANDED_INDICES = [
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^DJI', name: 'Dow Jones' },
    { symbol: '^IXIC', name: 'NASDAQ' },
    { symbol: '^RUT', name: 'Russell 2000' },
    { symbol: '^FTSE', name: 'FTSE 100' },
    { symbol: '^N225', name: 'Nikkei 225' },
];
