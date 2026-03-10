import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Admin credentials – set via environment variables.
// Defaults are the built-in admin account (change in production via env vars).
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alphalens.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@AlphaLens2026!';
const ADMIN_USER_ID = 'admin';

function safeCompare(a: string, b: string): boolean {
    try {
        const aBuf = Buffer.from(a);
        const bBuf = Buffer.from(b);
        if (aBuf.length !== bBuf.length) return false;
        return timingSafeEqual(aBuf, bBuf);
    } catch {
        return false;
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 });
        }

        // ── Admin fast-path (bypasses Supabase entirely) ──────────────────────
        if (safeCompare(username.trim().toLowerCase(), ADMIN_EMAIL.toLowerCase()) &&
            safeCompare(password, ADMIN_PASSWORD)) {
            const cookieStore = await cookies();
            const cookieOpts = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            };
            cookieStore.set('userId', ADMIN_USER_ID, cookieOpts);
            cookieStore.set('isAdmin', '1', cookieOpts);
            return NextResponse.json({ success: true, user: { id: ADMIN_USER_ID, username: ADMIN_EMAIL, isAdmin: true } });
        }

        // ── Regular Supabase login ─────────────────────────────────────────────
        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: '服务器配置错误，请联系管理员' }, { status: 500 });
        }
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase.auth.signInWithPassword({
            email: username,
            password: password,
        });

        if (error || !data.user) {
            return NextResponse.json({ error: '邮箱或密码错误，如未注册请先注册账号' }, { status: 401 });
        }

        const cookieStore = await cookies();
        cookieStore.set('userId', data.user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });
        // Ensure isAdmin is cleared for regular users
        cookieStore.delete('isAdmin');

        return NextResponse.json({ success: true, user: { id: data.user.id, username: data.user.email } });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: '服务器内部错误，请稍后重试' }, { status: 500 });
    }
}
