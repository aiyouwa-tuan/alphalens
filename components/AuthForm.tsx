'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (Client-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

interface AuthFormProps {
    initialView?: 'login' | 'register';
}

export default function AuthForm({ initialView = 'login' }: AuthFormProps) {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(initialView === 'login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
    const [loading, setLoading] = useState(false);

    // Sync state if prop changes
    useEffect(() => {
        setIsLogin(initialView === 'login');
        setErrors({});
    }, [initialView]);

    const validate = () => {
        const newErrors: typeof errors = {};

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Password Validation
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (!isLogin) {
            // Registration: Stronger rules
            if (password.length < 8) {
                newErrors.password = 'Password must be at least 8 characters';
            }
            // Optional: Require number/symbol if desired, but length is key for now.
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGoogleLogin = async () => {
        if (!supabase) {
            setErrors({ general: 'Google Login requires Supabase configuration.' });
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) {
            setErrors({ general: error.message });
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!validate()) return;

        setLoading(true);

        try {
            if (supabase) {
                // Supabase Auth Flow
                const { error } = isLogin
                    ? await supabase.auth.signInWithPassword({ email, password })
                    : await supabase.auth.signUp({ email, password });

                if (error) throw error;

                // On success
                router.push('/dashboard');
                router.refresh();
            } else {
                // Fallback to Legacy API (mock)
                const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
                // Map 'email' to 'username' for legacy API
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: email, password }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Authentication failed');

                router.push('/dashboard');
            }
        } catch (err: any) {
            setErrors({ general: err.message || 'Something went wrong' });
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        const target = isLogin ? '/register' : '/login';
        router.push(target);
        // Fallback state change if routing is slow or handled in-component
        setIsLogin(!isLogin);
        setErrors({});
    };

    return (
        <div className="w-full max-w-md p-8 bg-[var(--bg-panel)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">AlphaLens</h1>
                <p className="text-[var(--text-secondary)]">
                    {isLogin ? 'Welcome back via Email or Google' : 'Create your secure account'}
                </p>
            </div>

            {/* Error Banner */}
            {errors.general && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                    {errors.general}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full px-4 py-3 bg-[var(--bg-subtle)] border rounded-lg text-white focus:outline-none focus:ring-2 transition-all
                            ${errors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-[var(--border-subtle)] focus:border-[var(--text-accent)] focus:ring-[var(--text-accent)]/20'}
                        `}
                        placeholder="name@example.com"
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full px-4 py-3 bg-[var(--bg-subtle)] border rounded-lg text-white focus:outline-none focus:ring-2 transition-all
                            ${errors.password ? 'border-red-500 focus:ring-red-500/20' : 'border-[var(--border-subtle)] focus:border-[var(--text-accent)] focus:ring-[var(--text-accent)]/20'}
                        `}
                        placeholder="••••••••"
                    />
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>

                {/* Submit Logic */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-[var(--text-accent)] hover:bg-blue-600 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--border-subtle)]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[var(--bg-panel)] text-[var(--text-secondary)]">Or continue with</span>
                </div>
            </div>

            {/* Google Login */}
            <button
                onClick={handleGoogleLogin}
                type="button"
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-lg transition-colors border border-gray-200"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
                Sign in with Google
            </button>

            {/* Toggle Mode */}
            <div className="mt-8 text-center text-sm text-[var(--text-secondary)]">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                    onClick={toggleMode}
                    className="text-[var(--text-accent)] hover:underline font-semibold ml-1"
                >
                    {isLogin ? 'Sign up' : 'Log in'}
                </button>
            </div>
        </div>
    );
}
