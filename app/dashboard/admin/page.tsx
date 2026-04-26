import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { loadUserMetrics, loadEventPerformance, loadActivityFeed, loadTicketBuyers } from './data'
import { MetricsCards, MetricsCardsError } from './_components/metrics-cards'
import { EventsPerformanceTable } from './_components/events-performance-table'
import { ActivityFeed } from './_components/activity-feed'
import UserRoleManager from './_components/user-role-manager'
import { TicketBuyers } from './_components/ticket-buyers'

const MUTED = 'rgba(255,255,255,0.45)'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: MUTED }}>
      {children}
    </h2>
  )
}

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

  const [usersRes, performanceRes, feedRes, buyersRes] = await Promise.all([
    loadUserMetrics(),
    loadEventPerformance(),
    loadActivityFeed(),
    loadTicketBuyers(),
  ])

  const now = new Date().toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 pb-16" style={{ color: '#fff' }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Panel de administración</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>Takilla · Actualizado {now}</p>
      </div>

      {/* Metrics */}
      <section className="space-y-3">
        <SectionHeading>Métricas globales</SectionHeading>
        {usersRes.error || performanceRes.error ? (
          <MetricsCardsError error={usersRes.error ?? performanceRes.error!} />
        ) : (
          <MetricsCards users={usersRes.data!} performance={performanceRes.data!} />
        )}
      </section>

      {/* Grid CRM: 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Rendimiento por evento */}
        <section className="space-y-3 lg:col-span-2">
          <SectionHeading>Rendimiento por evento</SectionHeading>
          <EventsPerformanceTable
            events={performanceRes.data?.events ?? []}
            error={performanceRes.error}
          />
        </section>

        {/* Clientes con boletos */}
        <section className="space-y-3">
          <SectionHeading>Clientes con boletos</SectionHeading>
          <TicketBuyers buyers={buyersRes.data ?? []} error={buyersRes.error} />
        </section>

        {/* Actividad reciente */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <SectionHeading>Actividad reciente</SectionHeading>
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#4ade80' }}
              title="Live feed"
            />
          </div>
          <ActivityFeed items={feedRes.data ?? []} error={feedRes.error} />
        </section>

        {/* Gestión de roles */}
        <section className="space-y-3 lg:col-span-2">
          <SectionHeading>Gestión de roles</SectionHeading>
          <UserRoleManager />
        </section>

      </div>
    </div>
  )
}
