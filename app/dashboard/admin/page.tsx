import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { approveApplication, rejectApplication } from './actions'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: applications } = await supabase
    .from('organizer_applications')
    .select('id, business_name, tax_id, status, created_at, profiles(full_name, email)')
    .order('created_at', { ascending: false })

  const pending   = applications?.filter(a => a.status === 'pending')   ?? []
  const processed = applications?.filter(a => a.status !== 'pending')   ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Solicitudes de organizador</h1>
        <p className="text-zinc-500 mt-1">Aprueba o rechaza solicitudes para crear eventos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pendientes', value: pending.length,   color: 'text-amber-600' },
          { label: 'Aprobadas',  value: applications?.filter(a => a.status === 'approved').length ?? 0, color: 'text-green-600' },
          { label: 'Rechazadas', value: applications?.filter(a => a.status === 'rejected').length ?? 0, color: 'text-red-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-4">
            <p className="text-sm text-zinc-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Pending */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
          Pendientes ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center text-zinc-400">
            <Clock size={32} className="mx-auto mb-2 opacity-50" />
            No hay solicitudes pendientes
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(app => (
              <div key={app.id} className="bg-white rounded-xl border border-zinc-200 p-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900">{app.business_name}</p>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {(app.profiles as any)?.full_name} · {(app.profiles as any)?.email}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">RFC: {app.tax_id}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={approveApplication.bind(null, app.id)}>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle size={14} />
                      Aprobar
                    </button>
                  </form>
                  <form action={rejectApplication.bind(null, app.id)}>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-red-600 text-sm font-medium border border-red-200 hover:bg-red-50 transition-colors"
                    >
                      <XCircle size={14} />
                      Rechazar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Processed */}
      {processed.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
            Procesadas ({processed.length})
          </h2>
          <div className="space-y-2">
            {processed.map(app => (
              <div key={app.id} className="bg-white rounded-xl border border-zinc-200 px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-800">{app.business_name}</p>
                  <p className="text-sm text-zinc-400">{(app.profiles as any)?.email}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  app.status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {app.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
