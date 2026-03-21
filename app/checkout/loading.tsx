import Navbar from '@/components/navbar'

export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="h-4 w-28 bg-zinc-200 animate-pulse rounded" />

          <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
            <div className="space-y-2">
              <div className="h-3 w-16 bg-zinc-100 animate-pulse rounded" />
              <div className="h-8 w-56 bg-zinc-200 animate-pulse rounded" />
              <div className="h-4 w-48 bg-zinc-100 animate-pulse rounded" />
            </div>

            <div className="rounded-xl border border-zinc-200 p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 w-28 bg-zinc-100 animate-pulse rounded" />
                  <div className="h-4 w-20 bg-zinc-200 animate-pulse rounded" />
                </div>
              ))}
              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                <div className="h-4 w-12 bg-zinc-200 animate-pulse rounded" />
                <div className="h-7 w-24 bg-zinc-200 animate-pulse rounded" />
              </div>
            </div>

            <div className="h-12 w-full bg-zinc-200 animate-pulse rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  )
}
