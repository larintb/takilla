'use client'

import { useActionState } from 'react'
import { sendReminderAction, sendTestReminderAction } from '../actions'

type Event = {
  id: string
  title: string
  event_date: string | null
  location_name: string | null
  buyer_count: number
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'Fecha por confirmar'
  return new Date(dateStr).toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const MUTED = 'rgba(255,255,255,0.45)'
const MUTED_LOW = 'rgba(255,255,255,0.2)'

function StatusBanner({ state }: { state: { result?: { sent: number; failed: number; skipped: number; eventTitle: string }; error?: string; eventId?: string; testEventId?: string } | null }) {
  if (!state) return null
  if (state.error) {
    return (
      <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#fca5a5' }}>
        {state.error}
      </div>
    )
  }
  if (state.result) {
    const isTest = !!state.testEventId
    return (
      <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 10, padding: '14px 18px', fontSize: 14 }}>
        <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#86efac' }}>
          {isTest ? '✉️ Correo de prueba enviado a tu email' : `Recordatorios enviados para "${state.result.eventTitle}"`}
        </p>
        {!isTest && (
          <p style={{ margin: 0, color: MUTED }}>
            ✅ {state.result.sent} enviados
            {state.result.failed > 0 && ` · ❌ ${state.result.failed} fallidos`}
            {state.result.skipped > 0 && ` · ⏭ ${state.result.skipped} sin email`}
          </p>
        )}
      </div>
    )
  }
  return null
}

export function ReminderForm({ events }: { events: Event[] }) {
  const [sendState, sendAction, isSending] = useActionState(sendReminderAction, null)
  const [testState, testAction, isTesting] = useActionState(sendTestReminderAction, null)

  const state = testState ?? sendState
  const isPending = isSending || isTesting

  if (events.length === 0) {
    return <p style={{ color: MUTED, fontSize: 14 }}>No hay eventos publicados.</p>
  }

  return (
    <div className="space-y-4">
      <StatusBanner state={state} />

      <div className="space-y-3">
        {events.map((event) => {
          const justSent = sendState?.eventId === event.id && sendState?.result
          const justTested = testState?.testEventId === event.id && testState?.result

          return (
            <div
              key={event.id}
              style={{
                background: '#1b1233',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.06)',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: 15, color: '#f4f1ff' }}>
                  {event.title}
                </p>
                <p style={{ margin: '0 0 2px', fontSize: 12, color: MUTED }}>
                  {formatDate(event.event_date)}
                </p>
                {event.location_name && (
                  <p style={{ margin: 0, fontSize: 12, color: MUTED_LOW }}>
                    📍 {event.location_name}
                  </p>
                )}
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 12, color: MUTED }}>
                  {event.buyer_count} {event.buyer_count === 1 ? 'comprador' : 'compradores'}
                </p>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {/* Test button */}
                  <form action={testAction}>
                    <input type="hidden" name="eventId" value={event.id} />
                    <button
                      type="submit"
                      disabled={isPending}
                      style={{
                        background: justTested ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)',
                        color: justTested ? '#86efac' : MUTED,
                        border: justTested ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 50,
                        padding: '7px 14px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: isPending ? 'not-allowed' : 'pointer',
                        opacity: isPending ? 0.5 : 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {justTested ? '✓ Prueba enviada' : 'Enviar prueba'}
                    </button>
                  </form>

                  {/* Send to all button */}
                  <form action={sendAction}>
                    <input type="hidden" name="eventId" value={event.id} />
                    <button
                      type="submit"
                      disabled={isPending || event.buyer_count === 0}
                      style={{
                        background: justSent
                          ? 'rgba(74,222,128,0.15)'
                          : 'linear-gradient(90deg,#ff6e01 0%,#fa1492 55%,#720d98 100%)',
                        color: justSent ? '#86efac' : '#fff',
                        border: justSent ? '1px solid rgba(74,222,128,0.3)' : 'none',
                        borderRadius: 50,
                        padding: '7px 16px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: isPending || event.buyer_count === 0 ? 'not-allowed' : 'pointer',
                        opacity: isPending || event.buyer_count === 0 ? 0.5 : 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {justSent ? '✓ Enviado' : 'Enviar a todos'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
