import Navbar from '@/components/navbar'

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar />
      {children}
    </div>
  )
}
