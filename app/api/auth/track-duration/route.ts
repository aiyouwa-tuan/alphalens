import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: Request) {
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { trackingId, duration } = body;

        if (!trackingId || typeof duration !== 'number') {
            return NextResponse.json({ error: 'trackingId and duration required' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase
            .from('login_history')
            .update({ duration_seconds: duration })
            .eq('id', trackingId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Duration tracking error:', error);
        return NextResponse.json({ error: 'Failed to update duration' }, { status: 500 });
    }
}
