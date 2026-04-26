export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse pb-28 md:pb-0">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-32 bg-zinc-800 rounded" />
        <div className="h-4 w-24 bg-zinc-800 rounded" />
      </div>

      {/* KPI cards skeleton */}
      <div className="flex gap-3 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="min-w-[150px] h-24 rounded-xl bg-zinc-800/50 border border-zinc-800 flex-shrink-0" />
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-zinc-800/50 border border-zinc-800" />
        ))}
      </div>

      {/* Transactions skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-40 bg-zinc-800 rounded" />
        <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 border-b border-zinc-800 last:border-0">
              <div className="w-10 h-10 rounded-full bg-zinc-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-zinc-700 rounded" />
                <div className="h-3 w-20 bg-zinc-700 rounded" />
              </div>
              <div className="h-4 w-16 bg-zinc-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
