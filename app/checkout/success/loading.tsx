import { VT323 } from 'next/font/google'

const vt323 = VT323({ weight: '400', subsets: ['latin'] })

export default function CheckoutSuccessLoading() {
  return (
    <div className={`max-w-md mx-auto py-8 space-y-8 ${vt323.className}`}>
      <div className="text-center space-y-2">
        <div className="h-16 w-72 bg-zinc-700 animate-pulse rounded mx-auto" />
        <div className="h-6 w-80 bg-zinc-800 animate-pulse rounded mx-auto" />
      </div>

      {/* Retro ticket skeleton */}
      <div className="border-4 border-zinc-700 animate-pulse bg-zinc-900 shadow-[8px_8px_0_0_#3f3f46]">
        <div className="bg-zinc-700 h-12" />
        <div className="px-5 pt-4 pb-3 space-y-4">
          <div className="space-y-1">
            <div className="h-3 w-16 bg-zinc-700 rounded" />
            <div className="h-9 w-3/4 bg-zinc-700 rounded" />
          </div>
          <div className="space-y-1">
            <div className="h-3 w-12 bg-zinc-700 rounded" />
            <div className="h-6 w-56 bg-zinc-700 rounded" />
          </div>
          <div className="h-[3px] border-t-[3px] border-dashed border-zinc-600 mx-0" />
          <div className="flex justify-center py-2">
            <div className="w-32 h-32 bg-zinc-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
