import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    const cookieStore = await cookies();
    cookieStore.delete('userId');
    cookieStore.delete('isAdmin');
    return NextResponse.json({ success: true });
}
