export default function TicketsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-36 bg-zinc-700 animate-pulse rounded" />
        <div className="h-4 w-48 bg-zinc-700 animate-pulse rounded" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            {/* Event header */}
            <div className="p-5 flex gap-4">
              <div className="w-20 h-20 bg-zinc-700 animate-pulse rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 bg-zinc-700 animate-pulse rounded" />
                <div className="h-3 w-40 bg-zinc-800 animate-pulse rounded" />
                <div className="h-3 w-32 bg-zinc-800 animate-pulse rounded" />
                <div className="h-5 w-28 bg-zinc-800 animate-pulse rounded-full" />
              </div>
            </div>
            {/* Tickets stub */}
            <div className="border-t border-zinc-800 p-5 space-y-3">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="h-4 w-32 bg-zinc-800 animate-pulse rounded" />
                  <div className="h-8 w-8 bg-zinc-800 animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
