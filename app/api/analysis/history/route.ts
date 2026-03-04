import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

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
        if (!supabase) return NextResponse.json([], { status: 200 });
        const { userId, ip } = await getUserContext(request);

        let query = supabase!.from('analysis_history').select('*').order('created_at', { ascending: false }).limit(50);

        if (userId) {
            query = query.eq('user_id', userId);
        } else {
            query = query.eq('ip_address', ip);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Supabase get analysis history error:', error);
            return NextResponse.json({ error: 'Database Error' }, { status: 500 });
        }

        // Map column names back to frontend object structure
        const history = (data || []).map((row: any) => ({
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
        console.error('Analysis History GET error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { userId, ip } = await getUserContext(request);
        const body = await request.json();

        // Supports single item or array of items
        const items = Array.isArray(body) ? body : [body];

        const upsertData = items.map((item: any) => ({
            id: item.id,
            user_id: userId,
            ip_address: ip,
            ticker: item.ticker,
            status: item.status,
            markdown: item.markdown || null,
            market_report: item.market_report || null,
            fundamentals_report: item.fundamentals_report || null,
            sentiment_report: item.sentiment_report || null,
            technical_report: item.technical_report || null,
            external_news: item.news_report || null,
            start_time: item.startTime || null,
            end_time: item.endTime || null,
            created_at: item.timestamp || new Date().toISOString()
        }));

        if (!supabase) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
        const { error } = await supabase!.from('analysis_history').upsert(upsertData, {
            onConflict: 'id'
        });

        if (error) {
            console.error('Supabase analysis history POST error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Analysis History POST error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        if (!supabase) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
        const { userId, ip } = await getUserContext(request);

        // Delete all history for this user/ip
        let query = supabase!.from('analysis_history').delete();
        if (userId) {
            query = query.eq('user_id', userId);
        } else {
            query = query.eq('ip_address', ip);
        }

        const { error } = await query;
        if (error) {
            console.error('Supabase analysis history DELETE error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Analysis History DELETE error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
