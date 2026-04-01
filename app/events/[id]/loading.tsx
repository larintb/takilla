export default function EventDetailLoading() {
  return (
    <>
      {/* Banner skeleton */}
      <div className="w-full h-64 md:h-[420px] bg-zinc-800 animate-pulse relative">
        <div className="absolute inset-x-0 bottom-0 px-4 pb-6">
          <div className="max-w-5xl mx-auto space-y-2">
            <div className="h-9 w-2/3 bg-zinc-700 rounded" />
            <div className="flex gap-2">
              <div className="h-7 w-48 bg-zinc-700 rounded-full" />
              <div className="h-7 w-36 bg-zinc-700 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Back link */}
        <div className="h-4 w-32 bg-zinc-700 animate-pulse rounded" />

        {/* Two-column */}
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {/* Left */}
          <div className="md:col-span-2 space-y-6">
            <div className="border-t border-zinc-800 pt-5 space-y-3">
              <div className="h-3 w-28 bg-zinc-700 animate-pulse rounded" />
              <div className="h-4 w-full bg-zinc-800 animate-pulse rounded" />
              <div className="h-4 w-full bg-zinc-800 animate-pulse rounded" />
              <div className="h-4 w-4/5 bg-zinc-800 animate-pulse rounded" />
            </div>
          </div>

          {/* Right */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-4">
            <div className="space-y-1">
              <div className="h-3 w-16 bg-zinc-800 animate-pulse rounded" />
              <div className="h-8 w-28 bg-zinc-700 animate-pulse rounded" />
            </div>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="h-5 w-24 bg-zinc-700 animate-pulse rounded" />
                    <div className="h-3 w-32 bg-zinc-800 animate-pulse rounded" />
                  </div>
                  <div className="h-7 w-14 bg-zinc-700 animate-pulse rounded" />
                </div>
                <div className="h-1 bg-zinc-800 animate-pulse rounded-full" />
                <div className="flex items-center gap-3">
                  <div className="h-3 w-16 bg-zinc-800 animate-pulse rounded mr-auto" />
                  <div className="w-8 h-8 bg-zinc-800 animate-pulse rounded-lg" />
                  <div className="w-6 h-4 bg-zinc-700 animate-pulse rounded" />
                  <div className="w-8 h-8 bg-zinc-800 animate-pulse rounded-lg" />
                </div>
                <div className="h-10 w-full bg-zinc-700 animate-pulse rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
