import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

// Supabase Direct Postgres Connection (Bypasses PostgREST Cache & RLS)
const pool = new Pool({
    host: 'db.gfgkeobfkokqgmebqgbt.supabase.co',
    user: 'postgres',
    password: process.env.DB_PASSWORD || 'YpJxPXlGD1maGJDY', // Use hardcoded for migration ease if env is missing
    database: 'postgres',
    port: 6543, // pgBouncer pooled port for serverless stability
    ssl: { rejectUnauthorized: false }
});

async function getUserContext(request: Request) {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value || null;

    // Attempt to get IP address from headers
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    let ip = forwardedFor ? forwardedFor.split(',')[0] : (realIp || 'unknown');

    return { userId, ip };
}

export async function GET(request: Request) {
    try {
        const { userId, ip } = await getUserContext(request);

        let result;
        if (userId) {
            result = await pool.query(
                'SELECT * FROM analysis_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
                [userId]
            );
        } else {
            result = await pool.query(
                'SELECT * FROM analysis_history WHERE ip_address = $1 ORDER BY created_at DESC LIMIT 50',
                [ip]
            );
        }

        // Map column names back to frontend object structure
        const history = (result.rows || []).map((row: any) => ({
            id: row.id,
            ticker: row.ticker,
            status: row.status,
            markdown: row.markdown,
            market_report: row.market_report,
            fundamentals_report: row.fundamentals_report,
            sentiment_report: row.sentiment_report,
            technical_report: row.technical_report,
            news_report: row.external_news,
            timestamp: row.created_at,
            startTime: row.start_time || row.created_at,
            endTime: row.end_time || (row.status === 'completed' || row.status === 'error' ? row.created_at : undefined),
            taskId: null
        }));

        return NextResponse.json(history);
    } catch (error) {
        console.error('Analysis History GET pg error:', error);
        return NextResponse.json({ error: 'Database Connection Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { userId, ip } = await getUserContext(request);
        const body = await request.json();

        // Supports single item or array of items
        const items = Array.isArray(body) ? body : [body];

        for (const item of items) {
            await pool.query(
                `INSERT INTO analysis_history 
                (id, user_id, ip_address, ticker, status, markdown, market_report, fundamentals_report, sentiment_report, technical_report, external_news, start_time, end_time, created_at) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT (id) DO UPDATE SET 
                status = EXCLUDED.status, 
                markdown = EXCLUDED.markdown,
                market_report = COALESCE(EXCLUDED.market_report, analysis_history.market_report),
                fundamentals_report = COALESCE(EXCLUDED.fundamentals_report, analysis_history.fundamentals_report),
                sentiment_report = COALESCE(EXCLUDED.sentiment_report, analysis_history.sentiment_report),
                technical_report = COALESCE(EXCLUDED.technical_report, analysis_history.technical_report),
                external_news = COALESCE(EXCLUDED.external_news, analysis_history.external_news),
                end_time = EXCLUDED.end_time;`,
                [
                    item.id,
                    userId,
                    ip,
                    item.ticker,
                    item.status,
                    item.markdown || null,
                    item.market_report || null,
                    item.fundamentals_report || null,
                    item.sentiment_report || null,
                    item.technical_report || null,
                    item.external_news || null,
                    item.startTime || null,
                    item.endTime || null,
                    item.timestamp || new Date().toISOString()
                ]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Analysis History POST pg error:', error);
        return NextResponse.json({ error: 'Database Connection Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { userId, ip } = await getUserContext(request);

        // Delete all history for this user/ip
        if (userId) {
            await pool.query('DELETE FROM analysis_history WHERE user_id = $1', [userId]);
        } else {
            await pool.query('DELETE FROM analysis_history WHERE ip_address = $1', [ip]);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Analysis History DELETE pg error:', error);
        return NextResponse.json({ error: 'Database Connection Error' }, { status: 500 });
    }
}
