export default function NewEventLoading() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <div className="h-7 w-40 bg-zinc-200 animate-pulse rounded" />
        <div className="h-4 w-56 bg-zinc-200 animate-pulse rounded" />
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-24 bg-zinc-200 animate-pulse rounded" />
            <div className="h-10 w-full bg-zinc-100 animate-pulse rounded-lg" />
          </div>
        ))}
        <div className="space-y-1.5">
          <div className="h-3 w-24 bg-zinc-200 animate-pulse rounded" />
          <div className="h-24 w-full bg-zinc-100 animate-pulse rounded-lg" />
        </div>
        <div className="h-11 w-full bg-zinc-200 animate-pulse rounded-xl" />
      </div>
    </div>
  )
}
