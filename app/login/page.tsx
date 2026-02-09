'use client';

import AuthForm from '@/components/AuthForm';

export default function LoginPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-app)] p-4">
            <AuthForm />
        </div>
    );
}
