export default function DashboardEventsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-7 w-36 bg-zinc-200 animate-pulse rounded" />
          <div className="h-4 w-28 bg-zinc-200 animate-pulse rounded" />
        </div>
        <div className="h-9 w-32 bg-zinc-200 animate-pulse rounded-lg" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-white rounded-xl border border-zinc-200 px-5 py-4"
          >
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-5 w-2/3 bg-zinc-200 animate-pulse rounded" />
              <div className="flex items-center gap-3">
                <div className="h-3 w-24 bg-zinc-100 animate-pulse rounded" />
                <div className="h-3 w-28 bg-zinc-100 animate-pulse rounded" />
              </div>
            </div>
            <div className="h-5 w-16 bg-zinc-100 animate-pulse rounded-full ml-4" />
          </div>
        ))}
      </div>
    </div>
  )
}
