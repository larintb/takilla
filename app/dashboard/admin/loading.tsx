export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <div className="h-7 w-64 bg-zinc-200 animate-pulse rounded" />
        <div className="h-4 w-72 bg-zinc-200 animate-pulse rounded" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-zinc-200 p-4 space-y-2">
            <div className="h-3 w-20 bg-zinc-200 animate-pulse rounded" />
            <div className="h-9 w-12 bg-zinc-200 animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Pending applications */}
      <div className="space-y-3">
        <div className="h-5 w-36 bg-zinc-200 animate-pulse rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-zinc-200 p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="h-5 w-40 bg-zinc-200 animate-pulse rounded" />
                <div className="h-3 w-28 bg-zinc-100 animate-pulse rounded" />
                <div className="h-3 w-32 bg-zinc-100 animate-pulse rounded" />
              </div>
              <div className="h-5 w-20 bg-zinc-100 animate-pulse rounded-full" />
            </div>
            <div className="flex gap-2 pt-1">
              <div className="h-8 w-24 bg-zinc-200 animate-pulse rounded-lg" />
              <div className="h-8 w-24 bg-zinc-100 animate-pulse rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
