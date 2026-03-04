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
        const { email } = body;
        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        // Get IP from headers (Vercel standard)
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown IP';
        let cleanIp = ip.split(',')[0].trim(); // Take first IP if it's a list

        // Resolve location
        let location = 'Unknown Location';
        if (cleanIp !== 'Unknown IP' && cleanIp !== '::1' && cleanIp !== '127.0.0.1') {
            try {
                const geoRes = await fetch(`https://ipapi.co/${cleanIp}/json/`);
                if (geoRes.ok) {
                    const geo = await geoRes.json();
                    if (geo.city && geo.country_name) {
                        location = `${geo.city}, ${geo.region}, ${geo.country_name}`;
                    }
                }
            } catch (e) {
                console.error('IP resolving error:', e);
            }
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Insert into table and get the tracking UUID back
        const { data, error } = await supabase
            .from('login_history')
            .insert([{
                email: email,
                ip_address: cleanIp,
                location: location
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, trackingId: data.id });
    } catch (error) {
        console.error('Telemetry tracking error:', error);
        return NextResponse.json({ error: 'Failed to record login telemetry' }, { status: 500 });
    }
}
