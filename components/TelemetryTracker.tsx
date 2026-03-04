'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function TelemetryTracker() {
    const trackingIdRef = useRef<string | null>(null);
    const durationRef = useRef<number>(0);

    useEffect(() => {
        if (!supabase) return;
        const client = supabase;

        const initTelemetry = async () => {
            const { data: { session } } = await client.auth.getSession();
            if (!session?.user?.email) return;

            // Only track once per browser session
            if (sessionStorage.getItem('telemetry_tracked')) return;
            sessionStorage.setItem('telemetry_tracked', 'true');

            try {
                const res = await fetch('/api/auth/track-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: session.user.email })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.trackingId) {
                        trackingIdRef.current = data.trackingId;
                    }
                }
            } catch (e) {
                console.error("Telemetry error", e);
            }
        };

        initTelemetry();

        // Heartbeat every 60 seconds
        const interval = setInterval(() => {
            if (trackingIdRef.current) {
                durationRef.current += 60;
                fetch('/api/auth/track-duration', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ trackingId: trackingIdRef.current, duration: durationRef.current }),
                    keepalive: true
                }).catch(() => null);
            }
        }, 60000);

        // Before unload beacon for final duration ping
        const handleUnload = () => {
            if (trackingIdRef.current) {
                const blob = new Blob([JSON.stringify({ trackingId: trackingIdRef.current, duration: durationRef.current })], { type: 'application/json' });
                navigator.sendBeacon('/api/auth/track-duration', blob);
            }
        };
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            clearInterval(interval);
            window.removeEventListener('beforeunload', handleUnload);
        }
    }, []);

    return null;
}
