import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_USER_ID = 'admin';

async function isAdminSession(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('isAdmin')?.value === '1' &&
        cookieStore.get('userId')?.value === ADMIN_USER_ID;
}

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('system_settings')
            .select('config_value')
            .eq('key_name', 'ai_provider')
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching settings:', error);
            return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
        }

        // Return default if not found
        if (!data) {
            return NextResponse.json({ provider: 'google', model: 'gemini-3-pro-preview' });
        }

        return NextResponse.json(data.config_value);
    } catch (error) {
        console.error('Settings API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const admin = await isAdminSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const body = await request.json();
        const { provider, model } = body;

        if (!provider || !model) {
            return NextResponse.json({ error: 'Provider and model are required' }, { status: 400 });
        }

        const configValue = { provider, model };

        const { error } = await supabase
            .from('system_settings')
            .upsert({
                key_name: 'ai_provider',
                config_value: configValue
            }, { onConflict: 'key_name' });

        if (error) {
            console.error('Error saving settings:', error);
            return NextResponse.json({ error: `Failed to save settings: ${error.message || JSON.stringify(error)}` }, { status: 500 });
        }

        return NextResponse.json({ success: true, config: configValue });
    } catch (error) {
        console.error('Settings API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
