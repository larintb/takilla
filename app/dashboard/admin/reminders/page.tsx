import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { ReminderForm } from './_components/reminder-form'

export default async function RemindersPage() {
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

  const admin = createAdminClient()

  const { data: events } = await admin
    .from('events')
    .select('id, title, event_date, location_name')
    .eq('status', 'published')
    .order('event_date', { ascending: true })

  // Count unique buyers per event
  const eventIds = (events ?? []).map((e) => e.id)
  const { data: tickets } = eventIds.length
    ? await admin
        .from('tickets')
        .select('event_id, owner_id')
        .in('event_id', eventIds)
    : { data: [] as { event_id: string; owner_id: string }[] }

  const buyerCountMap = new Map<string, Set<string>>()
  for (const t of tickets ?? []) {
    if (!buyerCountMap.has(t.event_id)) buyerCountMap.set(t.event_id, new Set())
    buyerCountMap.get(t.event_id)!.add(t.owner_id)
  }

  const eventsWithCounts = (events ?? []).map((e) => ({
    ...e,
    buyer_count: buyerCountMap.get(e.id)?.size ?? 0,
  }))

  const MUTED = 'rgba(255,255,255,0.45)'

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-16" style={{ color: '#fff' }}>
      <div style={{ marginBottom: 32 }}>
        <a
          href="/dashboard/admin"
          style={{ fontSize: 13, color: MUTED, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}
        >
          ← Panel admin
        </a>
        <h1 className="text-2xl font-bold text-white">Enviar recordatorios</h1>
        <p style={{ marginTop: 6, fontSize: 14, color: MUTED }}>
          Manda un correo a todos los compradores de un evento con los detalles y ubicación.
        </p>
      </div>

      <ReminderForm events={eventsWithCounts} />
    </div>
  )
}
