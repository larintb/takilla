export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Takilla</h1>
          <p className="text-zinc-500 mt-1">Boletos para tu ciudad</p>
        </div>
        {children}
      </div>
    </div>
  )
}
