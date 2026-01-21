import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const userId = request.cookies.get('userId')?.value;
    const { pathname } = request.nextUrl;

    // Protect Dashboard
    if (pathname.startsWith('/dashboard')) {
        if (!userId) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Redirect authenticated user from Login/Root to Dashboard
    if ((pathname === '/login' || pathname === '/') && userId) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirect root to login if not authenticated
    if (pathname === '/' && !userId) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/'],
};
