import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { Pencil } from 'lucide-react'
import EventEditForm from '../[id]/_components/event-edit-form'
import { createEventWithInfo } from './actions'

export default async function NewEventPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, terms_accepted_at')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'organizer' && profile?.role !== 'admin') redirect('/dashboard')
  if (!profile?.terms_accepted_at) redirect('/dashboard/onboarding')

  const defaultDate = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8 animate-fade-in-up">

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="bg-purple-900/40 text-purple-300 border border-purple-700/50 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            Borrador
          </span>
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-orange)' }}>
            <Pencil size={11} /> Modo edición activo
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white">Nuevo evento</h1>
      </div>

      {/* Form */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Pencil size={15} style={{ color: 'var(--color-orange)' }} />
          <h2 className="text-base font-semibold text-white">Información del evento</h2>
        </div>

        <EventEditForm
          action={createEventWithInfo}
          defaultValues={{
            title:       'Nuevo evento',
            description: '',
            event_date:  defaultDate,
            status:      'draft',
            category:    'otro',
          }}
          submitLabel="Continuar"
        />

        {/* Submit section */}
        <div className="rounded-2xl border p-5 flex flex-col items-end gap-3 mt-6"
          style={{ background: 'var(--background)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm w-full" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Continúa para agregar boletos y publicar tu evento
          </p>
          <button
            type="submit"
            form="event-edit-form"
            className="flex items-center gap-2 px-6 h-12 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'var(--accent-gradient)' }}
          >
            Continuar →
          </button>
        </div>
      </section>

    </div>
  )
}