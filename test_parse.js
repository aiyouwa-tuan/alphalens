const str = "[{'type': 'text', 'text': '这是一份关于 **Alphabet Inc.** 的报告。 \\n\\n激进派说：\\'不\\'。\\n\\n', 'extras': {'signature': 'Ev0p'}}]";

const cleanContent = (raw) => {
    if (!raw) return '';
    let text = typeof raw === 'string' ? raw : JSON.stringify(raw);

    if (text.trimStart().startsWith('[') && text.includes('text')) {
        const textPrefix = "'text': '";
        const startOfText = text.indexOf(textPrefix);
        
        // Sometimes it's double-qutoes if someone json.dumps it, but let's assume Python repr
        if (startOfText !== -1) {
            const possibleEndings = ["', 'type':", "', 'extras':", "'}]"];
            let endOfText = -1;
            for (const ending of possibleEndings) {
                const idx = text.lastIndexOf(ending);
                if (idx !== -1 && idx > endOfText) {
                    endOfText = idx;
                }
            }
            if (endOfText !== -1) {
                text = text.substring(startOfText + textPrefix.length, endOfText);
            }
        }
    }

    text = text
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"');

    return text.trim();
};

console.log(cleanContent(str));
