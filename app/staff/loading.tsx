// Staff uses dark theme (bg-zinc-950)
export default function StaffLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Scanner placeholder */}
        <div className="aspect-square w-full bg-zinc-800 animate-pulse rounded-2xl" />
        <div className="space-y-2 text-center">
          <div className="h-5 w-40 bg-zinc-700 animate-pulse rounded mx-auto" />
          <div className="h-4 w-56 bg-zinc-800 animate-pulse rounded mx-auto" />
        </div>
      </div>
    </div>
  )
}
