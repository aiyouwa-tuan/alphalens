import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const userId = request.cookies.get('userId')?.value;
    const { pathname } = request.nextUrl;

    // Always redirect root to dashboard (publicly accessible now)
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirect authenticated user from Login to Dashboard
    if (pathname === '/login' && userId) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/'],
};
