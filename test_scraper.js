const cheerio = require('cheerio');
// Native fetch in Node 18+

async function testScraper() {
    const symbol = 'NVDA';
    const url = `https://www.google.com/finance/quote/${symbol}:NASDAQ`;

    console.log(`Scraping: ${url}`);

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await res.text();
        const $ = cheerio.load(html);

        // Main Price
        const mainPrice = $('.YMlKec.fxKbKc').first().text();
        console.log(`Main Price: ${mainPrice}`);

        // Find Change and Percent
        // Usually inside a div with class 'phylBO' or 'NydbP' common container
        // Or specific badged like 'JwB6zf'
        // Let's dump text of elements containing "%"

        $('span, div').filter((i, el) => $(el).text().includes('%')).each((i, el) => {
            const t = $(el).text().trim();
            // Limit length to avoid body dumps
            if (t.length < 50) {
                console.log(`Potential Change Data [${i}]: ${t} (Class: ${$(el).attr('class')})`);
            }
        });

        // Also text near main price
        const priceParent = $('.YMlKec.fxKbKc').first().parent();
        console.log(`Price Parent Text: ${priceParent.text()}`);
        console.log(`Price Container Text: ${$('.YMlKec.fxKbKc').first().parent().parent().text()}`);

        // Look for "After hours" label or similar
        // Usually it's in a div like 'b4EnYd' or nearby
        // Let's dump text of likely candidates

        // Strategy: specific class for extended hours?
        // Often 'P6K39c' is the label/price container for secondary data

        $('.P6K39c').each((i, el) => {
            console.log(`Secondary Data [${i}]: ${$(el).text().trim()}`);
        });

        // Try to find any text containing "After hours" or "Post-market"
        const entireText = $('body').text();
        const afterHoursIndex = entireText.indexOf('After hours');
        if (afterHoursIndex !== -1) {
            console.log('Found "After hours" text in body. Context:');
            console.log(entireText.substring(afterHoursIndex, afterHoursIndex + 50));
        }

    } catch (e) {
        console.error('Scrape failed:', e);
    }
}

testScraper();
