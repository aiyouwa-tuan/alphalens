import AuthForm from '@/components/AuthForm';

export default function RegisterPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--bg-app)]">
            <AuthForm initialView="register" />
        </div>
    );
}
