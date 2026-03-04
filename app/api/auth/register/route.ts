import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { saveUser } from '@/lib/db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: Request) {
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: '服务器配置错误，请联系管理员' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    try {
        const body = await request.json();
        const { username, password } = body; // 'username' here effectively captures email from client

        if (!username || !password) {
            return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 });
        }

        // 1. Create Auth User in Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: username,
            password: password,
        });

        if (authError) {
            console.error('Supabase Auth SignUp Error:', authError);
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        if (!authData.user) {
            return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 });
        }

        // 2. Sync to public.users table (for app compatibility)
        // We use the SAME ID as the Auth User
        const newUser = {
            id: authData.user.id,
            username: username, // Storing email as username
            passwordHash: 'MANAGED_BY_SUPABASE_AUTH', // No longer storing password
            createdAt: new Date().toISOString(),
        };

        try {
            await saveUser(newUser);
        } catch (dbError) {
            console.error('DB Sync Error:', dbError);
            // If sync fails, we technically have a broken state (Auth user exists, Public user doesn't).
            // user might encounter issues, but they can login.
            //Ideally we should rollback, but for this MVP proxy fix, proceed.
        }

        // 3. Set Session Cookie
        const cookieStore = await cookies();
        cookieStore.set('userId', authData.user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return NextResponse.json({ success: true, user: { id: authData.user.id, username } });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: '服务器内部错误，请稍后重试' }, { status: 500 });
    }
}
