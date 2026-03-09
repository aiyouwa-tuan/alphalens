export default function NewsLoading() {
    return (
        <div className="p-6 space-y-4 animate-pulse">
            {/* Filter tabs */}
            <div className="flex gap-2 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-8 w-20 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] shrink-0" />
                ))}
            </div>
            {/* News items */}
            {[...Array(8)].map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]" />
            ))}
        </div>
    );
}
