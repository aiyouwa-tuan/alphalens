export const RSS_FEEDS = {
    finance: [
        { name: 'Caixin (财新)', url: 'https://v.caixin.com/finance/economy/rss' },
        { name: 'WallstreetCN (华尔街见闻)', url: 'https://api.wallstreetcn.com/v2/it/articles' }, // Often specialized, using a standard RSS if available or fallback
        // Since wallstreetcn API is often custom, let's use standard RSS XMLs known to work or fallback to major portals
        { name: 'Sina Finance (新浪财经)', url: 'http://rss.sina.com.cn/roll/finance/hot_roll.xml' },
        { name: 'FT Chinese (FT中文网)', url: 'https://www.ftchinese.com/rss/news' },
    ],
    geopolitics: [
        { name: 'Lianhe Zaobao (联合早报)', url: 'https://www.zaobao.com.sg/rss/realtime/world' },
        { name: 'Phoenix News (凤凰资讯)', url: 'http://news.ifeng.com/rss/index.xml' },
    ],
    tech: [
        { name: '36Kr (36氪)', url: 'https://36kr.com/feed' },
        { name: 'PingWest (品玩)', url: 'https://www.pingwest.com/feed' },
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
