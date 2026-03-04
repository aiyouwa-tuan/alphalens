const strings = [
    "Neutral Analyst: [{'type': 'text', 'text': '这是一段文字', 'extras': {'signature': '123'}}]",
    "Aggressive Analyst: [{'type': 'text', 'text': '段落2', 'cache_control': null}]",
    "Conservative Analyst: [{'type': 'text', 'text': '段落3'}]"
];

const cleanContent = (raw) => {
    let text = typeof raw === 'string' ? raw : JSON.stringify(raw);

    // Strip [ {"type": "text", "text": " or [ {'type': 'text', 'text': '
    text = text.replace(/\[\s*\{\s*["']type["']\s*:\s*["']text["']\s*,\s*["']text["']\s*:\s*["']/g, '');
    
    // Also handle case where type is omitted
    text = text.replace(/\[\s*\{\s*["']text["']\s*:\s*["']/g, '');

    // Strip ending wrapper: `", ...}]` or `', ...}]`
    // Matches quote, followed by an optional `, 'key': value` or `, "key": value` sequence, then }]
    // Make sure we use non-greedy `.*?` but dot doesn't match newlines without `s` flag.
    // In Javascript, `[\s\S]` matches everything including newlines.
    text = text.replace(/["'],\s*["'][a-zA-Z_]+["']\s*:[\s\S]*?\}\s*\]/g, '');
    text = text.replace(/["']\s*\}\s*\]/g, '');

    // Convert literal escape sequences to real characters properly
    text = text
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"');

    return text.trim();
};

for (const s of strings) {
    console.log(cleanContent(s));
}
