export default function EventsLoading() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Subheader skeleton */}
      <div
        className="sticky top-16 z-30 px-4 pt-4 pb-3 space-y-3"
        style={{ background: 'rgba(10,10,10,0.92)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="h-9 rounded-full animate-pulse max-w-6xl mx-auto" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="flex gap-2 max-w-6xl mx-auto">
          {[80, 64, 56, 72, 72, 48].map((w, i) => (
            <div key={i} className="flex-none h-8 rounded-full animate-pulse" style={{ width: w, background: 'rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      </div>

      {/* Cards skeleton */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="h-3 w-20 rounded animate-pulse mb-5" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] rounded-2xl mb-3" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="space-y-1.5 px-0.5">
                <div className="h-3.5 rounded w-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="h-3.5 rounded w-3/4" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="h-3 rounded w-1/2" style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
