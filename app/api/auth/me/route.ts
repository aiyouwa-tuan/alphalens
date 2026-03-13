import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_USER_ID = 'admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alphalens.local';

export async function GET() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    const isAdmin = cookieStore.get('isAdmin')?.value === '1';

    if (!userId) {
        return NextResponse.json({ user: null });
    }

    if (isAdmin && userId === ADMIN_USER_ID) {
        return NextResponse.json({
            user: {
                id: 'admin',
                email: ADMIN_EMAIL,
                isAdmin: true
            }
        });
    }

    return NextResponse.json({
        user: {
            id: userId,
            isAdmin: false
        }
    });
}
