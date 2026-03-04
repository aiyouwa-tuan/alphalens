const strings = [
    "[{'type': 'text', 'text': '这是一份关于 **Alphabet Inc.** 的报告。 \\n\\n激进派说：\\'不\\'。\\n\\n', 'extras': {'signature': 'Ev0p'}}]",
    "Neutral Analyst: [{'type': 'text', 'text': '好了，两位都先停一停。听你们争论，简直就像是在看一场只有“全押”和“弃牌”两个选项的扑克游戏。\\n\\n激进派的朋友，你的“T+1清仓75%”确实能让我们瞬间从风险中抽身。', 'extras': {'signature': 'XYZ'}}]",
    "A plain string without array wrapper.\n\nWith newlines."
];

const cleanContent = (raw) => {
    if (!raw) return '';
    let text = typeof raw === 'string' ? raw : JSON.stringify(raw);

    // Look for the Python list repr pattern injected anywhere in the string
    // e.g. "Some Prefix: [{'type': 'text', 'text': '... ACTUAL TEXT ...', 'extras': {...}}]"
    const textKey = "'text': '";
    const typeKey = "'type': 'text'";
    
    // Check if it looks like an Anthropic content block dump
    if (text.includes(textKey) && text.includes('[{')) {
        let result = "";
        // There might be multiple blocks, but typically it's just one prefix and one array.
        // Let's extract everything BEFORE the array as prefix
        const arrayStart = text.indexOf('[{');
        const prefix = text.substring(0, arrayStart);
        
        const startOfText = text.indexOf(textKey, arrayStart);
        
        if (startOfText !== -1) {
            const possibleEndings = ["', 'type':", "', 'extras':", "'}]"];
            let endOfText = -1;
            
            // Find the EARLIEST valid ending that comes AFTER startOfText
            // Wait, if there are single quotes inside the text, lastIndexOf might match a later block
            // but since there's typically only one text block per message, lastIndexOf is usually fine,
            // or we use a proper regex.
            for (const ending of possibleEndings) {
                const idx = text.lastIndexOf(ending);
                if (idx !== -1 && idx > endOfText && idx > startOfText) {
                    endOfText = idx;
                }
            }
            if (endOfText !== -1) {
                const content = text.substring(startOfText + textKey.length, endOfText);
                text = prefix + content;
            }
        }
    }

    // Convert literal escape sequences to real characters properly
    text = text
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"');

    return text.trim();
};

for (const s of strings) {
    console.log("=== RAW ===");
    console.log(s);
    console.log("=== CLEANED ===");
    console.log(cleanContent(s));
    console.log("\n");
}
