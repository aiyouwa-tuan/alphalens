'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Dashboard Error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] p-4">
            <div className="bg-[var(--bg-panel)] p-8 rounded-xl border border-red-500/30 shadow-2xl max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold mb-2">Something went wrong!</h2>
                <p className="text-[var(--text-secondary)] mb-6 text-sm">
                    {error.message || "A client-side error occurred."}
                </p>
                <code className="block bg-black/30 p-2 rounded text-xs text-left mb-6 font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                    {error.digest}
                </code>
                <button
                    onClick={() => reset()}
                    className="w-full py-2 px-4 bg-[var(--text-accent)] hover:bg-blue-600 rounded-lg font-medium transition-colors"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
