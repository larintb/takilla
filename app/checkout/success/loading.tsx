import { VT323 } from 'next/font/google'

const vt323 = VT323({ weight: '400', subsets: ['latin'] })

export default function CheckoutSuccessLoading() {
  return (
    <div className={`max-w-md mx-auto py-8 space-y-8 ${vt323.className}`}>
      <div className="text-center space-y-2">
        <div className="h-16 w-72 bg-zinc-200 animate-pulse rounded mx-auto" />
        <div className="h-6 w-80 bg-zinc-100 animate-pulse rounded mx-auto" />
      </div>

      {/* Retro ticket skeleton */}
      <div className="border-4 border-zinc-200 animate-pulse bg-amber-50 shadow-[8px_8px_0_0_#e4e4e7]">
        <div className="bg-zinc-200 h-12" />
        <div className="px-5 pt-4 pb-3 space-y-4">
          <div className="space-y-1">
            <div className="h-3 w-16 bg-zinc-200 rounded" />
            <div className="h-9 w-3/4 bg-zinc-200 rounded" />
          </div>
          <div className="space-y-1">
            <div className="h-3 w-12 bg-zinc-200 rounded" />
            <div className="h-6 w-56 bg-zinc-200 rounded" />
          </div>
          <div className="h-[3px] border-t-[3px] border-dashed border-zinc-300 mx-0" />
          <div className="flex justify-center py-2">
            <div className="w-32 h-32 bg-zinc-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
