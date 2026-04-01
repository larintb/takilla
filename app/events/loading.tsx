export default function EventsLoading() {
  return (
    <>
      {/* Banner skeleton */}
      <div className="bg-zinc-800 animate-pulse">
        <div className="max-w-6xl mx-auto px-4 py-16 space-y-3">
          <div className="h-3 w-40 bg-zinc-700 rounded" />
          <div className="h-10 w-56 bg-zinc-700 rounded" />
          <div className="h-4 w-80 bg-zinc-700 rounded" />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="h-44 bg-zinc-700 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-zinc-700 animate-pulse rounded" />
                <div className="h-4 w-3/4 bg-zinc-700 animate-pulse rounded" />
                <div className="space-y-1 pt-1">
                  <div className="h-3 w-32 bg-zinc-800 animate-pulse rounded" />
                  <div className="h-3 w-28 bg-zinc-800 animate-pulse rounded" />
                </div>
                <div className="pt-2 border-t border-zinc-800">
                  <div className="h-4 w-20 bg-zinc-700 animate-pulse rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
