const str = "Neutral Analyst: [{'type': 'text', 'text': '好了，这是我的方案。', 'extras': {'signature': '123'}}]";
const str2 = "[{'text': 'Text chunk without type', 'extras': {}}]";
const str3 = "Prefix [{ \n\n'text':'123'\n}]\n\n";

const cleanContent = (raw) => {
    if (!raw) return '';
    let text = typeof raw === 'string' ? raw : JSON.stringify(raw);

    // Remove Python List repr wrappers around Anthropic ContentBlocks
    // This safely strips the `[{'type': 'text', 'text': '` prefix and trailing keys
    text = text.replace(/\[\s*\{\s*'type'\s*:\s*'text'\s*,\s*'text'\s*:\s*'/g, '');
    text = text.replace(/\[\s*\{\s*'text'\s*:\s*'/g, ''); // Alternative

    // Safely strip the suffix like `', 'extras': {...}}]` or `'}]`
    // Matches the closing `'` of the text field optionally followed by other keys until `}]`
    // VERY IMPORTANT: regex needs to match across newlines inside `extras`!
    text = text.replace(/',\s*'extras'\s*:[^\]]*\}\s*\]/g, '');
    text = text.replace(/',\s*'cache_control'\s*:[^\]]*\}\s*\]/g, '');
    text = text.replace(/',\s*'[^']+'\s*:[^\]]*\}\s*\]/g, ''); // catch-all for other ending keys
    text = text.replace(/'\s*\}\s*\]/g, '');

    // Cleanup bare array markers if an empty array was sent (e.g. `[]` from other components like market data)
    if (text === '[]') text = '';
    text = text.replace(/^\[\]$/g, '');

    // Convert literal escape sequences to real characters properly
    text = text
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"');

    return text.trim();
};
console.log(cleanContent(str));
