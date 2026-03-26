export default function CheckoutLoading() {
  return (
    <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-4">
          <div className="h-4 w-28 bg-zinc-200 animate-pulse rounded" />

          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            {/* Event header */}
            <div className="flex gap-4 p-5 border-b border-zinc-100">
              <div className="w-16 h-16 rounded-xl bg-zinc-200 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-3/4 bg-zinc-200 animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-zinc-100 animate-pulse rounded" />
                <div className="h-3 w-2/5 bg-zinc-100 animate-pulse rounded" />
              </div>
            </div>

            {/* Order summary */}
            <div className="p-5 space-y-3">
              <div className="h-3 w-16 bg-zinc-100 animate-pulse rounded" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-zinc-100 animate-pulse rounded" />
                    <div className="h-4 w-20 bg-zinc-200 animate-pulse rounded" />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                <div className="h-5 w-12 bg-zinc-200 animate-pulse rounded" />
                <div className="h-8 w-24 bg-zinc-200 animate-pulse rounded" />
              </div>
            </div>

            {/* CTA */}
            <div className="px-5 pb-5 space-y-3">
              <div className="h-12 w-full bg-gradient-to-r from-amber-200 via-orange-200 to-red-200 animate-pulse rounded-xl" />
              <div className="h-3 w-3/4 bg-zinc-100 animate-pulse rounded mx-auto" />
            </div>
          </div>
        </div>
    </main>
  )
}
