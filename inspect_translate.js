const translate = require('google-translate-api-x');

async function testTranslation() {
    try {
        const text = "Tesla stock jumps after earnings report.";
        console.log(`Translating: "${text}"`);

        const res = await translate(text, { to: 'zh-CN' });
        console.log(`Result: "${res.text}"`);
    } catch (e) {
        console.error("Translation failed:", e);
    }
}

testTranslation();
