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

import { translate } from 'google-translate-api-x';

export async function fetchRSSFeeds(feeds: { name: string; url: string }[]): Promise<NewsItem[]> {
    const promises = feeds.map(async (feed) => {
        try {
            const feedData = await parser.parseURL(feed.url);

            // Limit items per feed to avoid hitting translation rate limits (e.g. 5 items)
            const limitedItems = feedData.items.slice(0, 5);

            const translatedItems = await Promise.all(limitedItems.map(async (item) => {
                let title = item.title || 'No Title';
                let contentSnippet = item.contentSnippet || item.summary || '';

                try {
                    // Translate Title
                    const titleRes = await translate(title, { to: 'zh-CN' });
                    title = titleRes.text;

                    // Translate Snippet (if exists)
                    if (contentSnippet) {
                        // Truncate to avoid huge payloads
                        const snippetRes = await translate(contentSnippet.slice(0, 200), { to: 'zh-CN' });
                        contentSnippet = snippetRes.text;
                    }
                } catch (err) {
                    console.warn(`Translation failed for ${item.title}:`, err);
                    // Fallback to original text if translation fails
                }

                return {
                    id: item.guid || item.link || item.title || Math.random().toString(36).substr(2, 9),
                    title: title,
                    link: item.link || '#',
                    pubDate: item.pubDate || new Date().toISOString(),
                    source: feed.name,
                    guid: item.guid,
                    contentSnippet: contentSnippet,
                };
            }));

            return translatedItems;
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
