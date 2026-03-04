import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: Request) {
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: '服务器配置错误，请联系管理员' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 });
        }

        // Server-Side Login via Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: username,
            password: password,
        });

        if (error || !data.user) {
            return NextResponse.json({ error: '邮箱或密码错误，如未注册请先注册账号' }, { status: 401 });
        }

        // Set session cookie
        const cookieStore = await cookies();
        cookieStore.set('userId', data.user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return NextResponse.json({ success: true, user: { id: data.user.id, username: data.user.email } });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: '服务器内部错误，请稍后重试' }, { status: 500 });
    }
}
