export default function AnalysisLoading() {
    return (
        <div className="p-6 space-y-4 animate-pulse">
            {/* Header bar */}
            <div className="h-12 w-64 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]" />
            {/* Chat area */}
            <div className="h-[60vh] rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]" />
            {/* Input bar */}
            <div className="h-14 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]" />
        </div>
    );
}
