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

const ADMIN_USER_ID = 'admin';
const ADMIN_SECRET_TOKEN = process.env.ADMIN_SECRET_TOKEN || 'alphalens-admin-secret-2026';

async function isAdminSession(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('isAdmin')?.value === '1' &&
           cookieStore.get('userId')?.value === ADMIN_USER_ID;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const admin = await isAdminSession();

        const payload = {
            ...body,
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
