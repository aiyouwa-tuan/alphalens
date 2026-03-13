import { NextRequest, NextResponse } from 'next/server';
import YahooFinanceClass from 'yahoo-finance2';

const yahooFinance = new YahooFinanceClass();

async function callGemini(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not set');

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.7,
                },
            }),
        }
    );

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function GET(request: NextRequest) {
    const ticker = request.nextUrl.searchParams.get('ticker');
    if (!ticker) {
        return NextResponse.json({ error: 'Missing ticker parameter' }, { status: 400 });
    }

    try {
        // Fetch current quote
        const quote = await yahooFinance.quote(ticker);
        const price = quote.regularMarketPrice || 0;
        const change = quote.regularMarketChange || 0;
        const changePercent = quote.regularMarketChangePercent || 0;
        const name = quote.shortName || quote.longName || ticker;

        // Fetch 30 days of history
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        let historicalData: any[] = [];
        try {
            const result = await yahooFinance.chart(ticker, {
                period1: startDate.toISOString().split('T')[0],
                period2: endDate.toISOString().split('T')[0],
                interval: '1d',
            });
            historicalData = result.quotes || [];
        } catch {
            // If chart fails, continue without history
        }

        const direction = changePercent >= 0 ? 'up' : 'down';
        const period30dChange = historicalData.length >= 2
            ? ((price - historicalData[0].close) / historicalData[0].close * 100).toFixed(2)
            : changePercent.toFixed(2);

        // Build prompt for Gemini
        const prompt = `You are a senior financial analyst. Analyze the recent price movement of ${name} (${ticker}).

Current price: $${price.toFixed(2)}
Today's change: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%
30-day change: ${period30dChange}%
Direction: ${direction}

Recent price data (last 30 days): ${historicalData.slice(-10).map(d =>
            `${new Date(d.date).toLocaleDateString()}: $${d.close?.toFixed(2)}`
        ).join(', ')}

Provide exactly 3-5 factors explaining this price movement. Each factor should have a probability (all probabilities must sum to 100).

Return JSON in this exact format:
{
  "diagnosis": "A one-sentence summary of the main driver",
  "factors": [
    {
      "name": "Factor name (short, 2-5 words)",
      "reason": "Brief explanation in Chinese (one sentence)",
      "probability": 40,
      "color": "red"
    }
  ]
}

Rules:
- Use colors: "red" for earnings/financials, "orange" for management/corporate, "amber" for macro/sector, "gray" for technical, "blue" for sentiment
- Probabilities must sum to exactly 100
- Write the "reason" field in Chinese
- Write the "name" field in Chinese with English notation (e.g., "基本面 / 财报预警")
- diagnosis should be in Chinese`;

        let factors;
        let diagnosis;

        try {
            const geminiResponse = await callGemini(prompt);
            const parsed = JSON.parse(geminiResponse);
            factors = parsed.factors;
            diagnosis = parsed.diagnosis;
        } catch {
            // Fallback if Gemini fails
            diagnosis = direction === 'down'
                ? `${name} 近期持续走弱，受多重因素影响。`
                : `${name} 近期表现强势，受多重利好推动。`;
            factors = [
                { name: '基本面 / 财报预警', reason: '近期财务数据引发市场关注', probability: 40, color: 'red' },
                { name: '公司高管变动', reason: '管理层调整带来不确定性', probability: 35, color: 'orange' },
                { name: '宏观 / Beta 因素', reason: '大盘走势及宏观经济环境影响', probability: 25, color: 'gray' },
            ];
        }

        return NextResponse.json({
            ticker,
            name,
            currentPrice: price,
            changePercent,
            period: '30d',
            direction,
            diagnosis,
            factors,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Anomaly API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to analyze ticker' },
            { status: 500 }
        );
    }
}
