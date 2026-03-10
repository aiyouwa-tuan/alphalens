/**
 * Server-side proxy for /api/debate/stream/{taskId}
 *
 * Proxies the SSE stream from the Python backend so the browser never
 * needs to know the backend URL (which may be an internal address).
 */
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
    request: NextRequest,
    { params }: { params: { taskId: string } }
) {
    const { taskId } = params;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    try {
        const backendRes = await fetch(`${backendUrl}/api/debate/stream/${taskId}`, {
            signal: request.signal,
            headers: {
                'Accept': 'text/event-stream',
                'Cache-Control': 'no-cache',
            },
        });

        if (!backendRes.ok || !backendRes.body) {
            return new Response(
                JSON.stringify({ error: 'Backend stream unavailable' }),
                { status: backendRes.status, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Stream the response body directly to the client
        return new Response(backendRes.body, {
            status: 200,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
            },
        });
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return new Response(null, { status: 499 });
        }
        console.error('Stream proxy error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to connect to analysis backend' }),
            { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
