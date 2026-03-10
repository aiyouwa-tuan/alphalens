import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

const DAILY_LIMIT = 3;
const ADMIN_USER_ID = 'admin';

function getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
}

async function getUsageFromCookie(userId: string): Promise<number> {
    const cookieStore = await cookies();
    const key = `analysis_usage_${userId}_${getTodayKey()}`;
    const val = cookieStore.get(key)?.value;
    return val ? parseInt(val, 10) : 0;
}

async function setUsageCookie(userId: string, used: number): Promise<void> {
    const cookieStore = await cookies();
    const key = `analysis_usage_${userId}_${getTodayKey()}`;
    cookieStore.set(key, String(used), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24,
        path: '/',
    });
}

async function getUsage(userId: string): Promise<number> {
    if (supabase) {
        try {
            const { data, error } = await supabase.from('analysis_usage').select('used')
                .eq('user_id', userId)
                .eq('date', getTodayKey())
                .single();
            if (!error && data) return data.used;
            if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205') {
                console.error('Supabase analysis_usage fetch error:', error);
            }
        } catch (e) {
            // Fall through to cookie
        }
    }
    return getUsageFromCookie(userId);
}

async function setUsage(userId: string, used: number): Promise<void> {
    if (supabase) {
        try {
            const { error } = await supabase.from('analysis_usage').upsert({
                user_id: userId,
                date: getTodayKey(),
                used,
            }, { onConflict: 'user_id,date' });
            if (!error) return;
            if (error.code !== 'PGRST205') {
                console.error('Supabase analysis_usage upsert error:', error);
            }
        } catch (e) {
            // Fall through to cookie
        }
    }
    await setUsageCookie(userId, used);
}

async function isAdminSession(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('isAdmin')?.value === '1' &&
           cookieStore.get('userId')?.value === ADMIN_USER_ID;
}

// GET: Return the user's daily usage
export async function GET() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
        return NextResponse.json({ loggedIn: false, used: 0, total: DAILY_LIMIT });
    }

    // Admin gets unlimited quota
    if (await isAdminSession()) {
        return NextResponse.json({ loggedIn: true, used: 0, total: 9999, isAdmin: true });
    }

    const used = await getUsage(userId);
    return NextResponse.json({ loggedIn: true, used, total: DAILY_LIMIT });
}

// POST: Increment the user's daily usage by 1 (admin skips increment)
export async function POST() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
        return NextResponse.json({ error: '请先登录后再使用分析功能' }, { status: 401 });
    }

    // Admin: never consume quota
    if (await isAdminSession()) {
        return NextResponse.json({ loggedIn: true, used: 0, total: 9999, isAdmin: true });
    }

    const currentUsed = await getUsage(userId);

    if (currentUsed >= DAILY_LIMIT) {
        return NextResponse.json({
            error: '今日分析次数已用完，请明天再来',
            used: currentUsed,
            total: DAILY_LIMIT,
        }, { status: 429 });
    }

    await setUsage(userId, currentUsed + 1);

    return NextResponse.json({
        loggedIn: true,
        used: currentUsed + 1,
        total: DAILY_LIMIT,
    });
}
