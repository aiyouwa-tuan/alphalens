import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use globalThis to guarantee a TRUE singleton even if Next.js
// re-evaluates this module across different webpack chunks.
const GLOBAL_KEY = '__supabase_singleton__' as const;

function getOrCreateClient(): SupabaseClient | null {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;

    // Check if already created on globalThis (survives module re-evaluation)
    if (typeof globalThis !== 'undefined' && (globalThis as any)[GLOBAL_KEY]) {
        return (globalThis as any)[GLOBAL_KEY] as SupabaseClient;
    }

    const client = createClient(url, key);

    if (typeof globalThis !== 'undefined') {
        (globalThis as any)[GLOBAL_KEY] = client;
    }

    return client;
}

export const supabase = getOrCreateClient();
