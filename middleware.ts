import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const userId = request.cookies.get('userId')?.value;
    const isAdmin = request.cookies.get('isAdmin')?.value;
    const { pathname } = request.nextUrl;

    // Always redirect root to dashboard (publicly accessible)
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirect authenticated users away from login/register
    // For admin: require both userId='admin' AND isAdmin='1' (prevent stale cookie loops)
    // For Supabase users: userId is a non-'admin' UUID
    if (pathname === '/login' || pathname === '/register') {
        const isValidAdminSession = userId === 'admin' && isAdmin === '1';
        const isValidSupabaseSession = userId && userId !== 'admin';
        if (isValidAdminSession || isValidSupabaseSession) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/login', '/register'],
};
