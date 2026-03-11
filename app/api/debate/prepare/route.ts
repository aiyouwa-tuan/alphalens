/**
 * Fast configuration resolver for analysis initialization.
 *
 * Responsibilities:
 * 1. Read global AI settings (provider, model) from Supabase.
 * 2. If the current session is an admin session, vend the ADMIN_SECRET_TOKEN
 *    so the browser can bypass backend IP limits by calling Render directly.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const ADMIN_USER_ID = 'admin';
const ADMIN_SECRET_TOKEN = process.env.ADMIN_SECRET_TOKEN || 'alphalens-admin-secret-2026';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function isAdminSession(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('isAdmin')?.value === '1' &&
        cookieStore.get('userId')?.value === ADMIN_USER_ID;
}

export async function GET() {
    try {
        const admin = await isAdminSession();

        // Default fallbacks
        let globalProvider = "google";
        let globalModel = "gemini-3-pro-preview";

        try {
            const { data } = await supabase
                .from('system_settings')
                .select('config_value')
                .eq('key_name', 'ai_provider')
                .single();
            if (data?.config_value?.provider) globalProvider = data.config_value.provider;
            if (data?.config_value?.model) globalModel = data.config_value.model;
        } catch (dbErr) {
            console.error('Failed to fetch global AI settings:', dbErr);
        }

        return NextResponse.json({
            provider: globalProvider,
            model: globalModel,
            admin_token: admin ? ADMIN_SECRET_TOKEN : ""
        });
    } catch (error) {
        console.error('Prepare config error:', error);
        return NextResponse.json({ error: 'Failed to prepare analysis configuration' }, { status: 500 });
    }
}
