import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_USER_ID = 'admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alphalens.local';

export async function GET() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
        return NextResponse.json({ user: null });
    }

    const isAdmin = cookieStore.get('isAdmin')?.value === '1' && userId === ADMIN_USER_ID;

    return NextResponse.json({
        user: {
            id: userId,
            email: isAdmin ? ADMIN_EMAIL : userId,
            isAdmin,
        }
    });
}
