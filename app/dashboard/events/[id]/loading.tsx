export default function EventEditLoading() {
  return (
    <div className="space-y-8">
      {/* Back link + status badge */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 bg-zinc-200 animate-pulse rounded" />
        <div className="h-6 w-20 bg-zinc-100 animate-pulse rounded-full" />
      </div>

      {/* Event header card */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
        <div className="flex gap-5">
          <div className="w-24 h-24 bg-zinc-200 animate-pulse rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-7 w-2/3 bg-zinc-200 animate-pulse rounded" />
            <div className="h-4 w-40 bg-zinc-100 animate-pulse rounded" />
            <div className="h-4 w-32 bg-zinc-100 animate-pulse rounded" />
          </div>
        </div>
        {/* Action buttons */}
        <div className="flex gap-3 pt-2 border-t border-zinc-100">
          <div className="h-9 w-32 bg-zinc-200 animate-pulse rounded-lg" />
          <div className="h-9 w-28 bg-zinc-200 animate-pulse rounded-lg" />
        </div>
      </div>

      {/* Tiers section */}
      <div className="space-y-4">
        <div className="h-6 w-32 bg-zinc-200 animate-pulse rounded" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-zinc-200 px-5 py-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-5 w-28 bg-zinc-200 animate-pulse rounded" />
                <div className="h-3 w-36 bg-zinc-100 animate-pulse rounded" />
              </div>
              <div className="h-4 w-16 bg-zinc-200 animate-pulse rounded" />
            </div>
          ))}
        </div>

        {/* Add tier form */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-3">
          <div className="h-5 w-24 bg-zinc-200 animate-pulse rounded" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-10 bg-zinc-100 animate-pulse rounded-lg" />
            <div className="h-10 bg-zinc-100 animate-pulse rounded-lg" />
          </div>
          <div className="h-10 bg-zinc-100 animate-pulse rounded-lg" />
          <div className="h-9 w-28 bg-zinc-200 animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  )
}
