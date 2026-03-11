/**
 * Server-side proxy for /api/debate/start
 *
 * Responsibilities:
 * 1. Forward the request to the Python backend.
 * 2. If the current session is an admin session, inject the ADMIN_SECRET_TOKEN
 *    so the backend can bypass its own IP-based rate limit.
 *    The token is NEVER exposed to the client.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Allow this API route (serverless function) to wait longer if Render is experiencing a cold start.
// Vercel Hobby allows up to 10s (default) or 60s (with config), Pro allows up to 300s.
export const maxDuration = 60;

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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const admin = await isAdminSession();

        // 1. Fetch Global Settings from DB
        let globalProvider = body.provider;
        let globalModel = body.model;

        try {
            const { data } = await supabase
                .from('system_settings')
                .select('config_value')
                .eq('key_name', 'ai_provider')
                .single();
            if (data?.config_value?.provider) globalProvider = data.config_value.provider;
            if (data?.config_value?.model) globalModel = data.config_value.model;
        } catch (dbErr) {
            console.error('Failed to fetch global AI settings', dbErr);
        }

        const payload = {
            ...body,
            provider: globalProvider,
            model: globalModel,
            ...(admin ? { admin_token: ADMIN_SECRET_TOKEN } : {}),
        };

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        const res = await fetch(`${backendUrl}/api/debate/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('Debate proxy error:', error);
        return NextResponse.json({ error: 'Failed to start analysis' }, { status: 500 });
    }
}
