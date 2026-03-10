export default function DashboardLoading() {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            {/* Top stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-28 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]" />
                ))}
            </div>
            {/* Main chart */}
            <div className="h-72 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]" />
            {/* Bottom widgets row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-56 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]" />
                ))}
            </div>
        </div>
    );
}
