import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';
import { findUserByUsername, saveUser } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
        }

        const existingUser = await findUserByUsername(username);
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const userId = uuidv4();
        const newUser = {
            id: userId,
            username,
            passwordHash: password,
            createdAt: new Date().toISOString(),
        };

        await saveUser(newUser);

        // Set session cookie
        const cookieStore = await cookies();
        cookieStore.set('userId', userId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return NextResponse.json({ success: true, user: { id: userId, username } });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
