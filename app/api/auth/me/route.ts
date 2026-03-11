import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    const isAdmin = cookieStore.get('isAdmin')?.value === '1';

    if (!userId) {
        return NextResponse.json({ user: null });
    }

    if (isAdmin) {
        return NextResponse.json({
            user: {
                id: 'admin',
                email: 'admin@alphalens.local', // Default admin placeholder
                isAdmin: true
            }
        });
    }

    // Optional: Return regular user info if needed, but for now we only strictly need admin bypass info.
    return NextResponse.json({
        user: {
            id: userId,
            isAdmin: false
        }
    });
}
