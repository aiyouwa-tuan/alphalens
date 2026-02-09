import Parser from 'rss-parser';

const parser = new Parser();

export interface NewsItem {
    id: string;
    title: string;
    link: string;
    pubDate: string;
    source: string;
    guid?: string;
    contentSnippet?: string;
}

export async function fetchRSSFeeds(feeds: { name: string; url: string }[]): Promise<NewsItem[]> {
    const promises = feeds.map(async (feed) => {
        try {
            const feedData = await parser.parseURL(feed.url);
            return feedData.items.map((item) => ({
                id: item.guid || item.link || item.title || Math.random().toString(36).substr(2, 9),
                title: item.title || 'No Title',
                link: item.link || '#',
                pubDate: item.pubDate || new Date().toISOString(),
                source: feed.name,
                guid: item.guid,
                contentSnippet: item.contentSnippet,
            }));
        } catch (error) {
            console.error(`Error fetching RSS feed ${feed.name}:`, error);
            return [];
        }
    });

    const results = await Promise.all(promises);
    // Flatten and sort by date (newest first)
    return results.flat().sort((a, b) => {
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });
}
