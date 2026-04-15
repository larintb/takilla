'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { stripePromise } from '@/utils/stripe/client'
import { Loader2, Clock, AlertCircle } from 'lucide-react'

// ── Countdown display ────────────────────────────────────────────────────────

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ── Inner form (needs Stripe context) ───────────────────────────────────────

function InnerForm({
  totalLabel,
  secondsLeft,
  expired,
  eventId,
}: {
  totalLabel: string
  secondsLeft: number
  expired: boolean
  eventId: string
}) {
  const stripe   = useStripe()
  const elements = useElements()
  const router   = useRouter()

  const [submitting, setSubmitting]   = useState(false)
  const [errorMsg,   setErrorMsg]     = useState<string | null>(null)
  const [ready,      setReady]        = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements || submitting || expired) return

    setSubmitting(true)
    setErrorMsg(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setErrorMsg(error.message ?? 'Error al procesar el pago.')
      setSubmitting(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      router.push(`/checkout/success?payment_intent=${paymentIntent.id}`)
      return
    }

    setErrorMsg('Estado de pago inesperado. Contacta soporte.')
    setSubmitting(false)
  }

  const urgent = secondsLeft <= 60 && secondsLeft > 0

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Countdown */}
      <div
        className="flex items-center justify-between rounded-xl px-4 py-2.5"
        style={{
          background: urgent ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${urgent ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
          transition: 'all 0.3s',
        }}
      >
        <div className="flex items-center gap-2">
          <Clock size={14} style={{ color: urgent ? '#ef4444' : 'rgba(255,255,255,0.3)' }} />
          <span className="text-xs" style={{ color: urgent ? '#ef4444' : 'rgba(255,255,255,0.35)' }}>
            {expired ? 'Tiempo agotado' : 'Tiempo para completar'}
          </span>
        </div>
        <span
          className="font-mono font-bold text-sm tabular-nums"
          style={{ color: urgent ? '#ef4444' : 'rgba(255,255,255,0.6)' }}
        >
          {expired ? '00:00' : formatTime(secondsLeft)}
        </span>
      </div>

      {/* Expired state */}
      {expired ? (
        <div
          className="rounded-xl p-5 text-center space-y-3"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <AlertCircle size={28} className="mx-auto text-red-400" />
          <p className="text-sm font-semibold text-white">El tiempo para pagar expiró</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Vuelve al evento e intenta de nuevo.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/events/${eventId}`)}
            className="mt-1 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
            style={{ background: 'var(--accent-gradient)' }}
          >
            Volver al evento
          </button>
        </div>
      ) : (
        <>
          {/* Payment Element */}
          <div className={ready ? '' : 'opacity-0 h-0 overflow-hidden'}>
            <PaymentElement
              onReady={() => setReady(true)}
              options={{ layout: 'accordion' }}
            />
          </div>

          {/* Skeleton while loading */}
          {!ready && (
            <div className="space-y-3">
              {[80, 60, 60].map((w, i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl animate-pulse"
                  style={{ width: `${w}%`, background: 'rgba(255,255,255,0.06)' }}
                />
              ))}
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <p className="text-sm text-red-400 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {errorMsg}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!stripe || !ready || submitting}
            className="w-full h-14 rounded-2xl font-bold text-base text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: 'var(--accent-gradient)', boxShadow: '0 0 28px rgba(249,115,22,0.28)' }}
          >
            {submitting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              `Pagar ${totalLabel}`
            )}
          </button>
        </>
      )}
    </form>
  )
}

// ── Outer component (fetches client_secret, manages timer) ───────────────────

export default function PaymentForm({
  eventId,
  tierId,
  quantity,
  totalLabel,
}: {
  eventId:    string
  tierId:     string
  quantity:   number
  totalLabel: string
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [expiresAt,    setExpiresAt]    = useState<number>(0)
  const [secondsLeft,  setSecondsLeft]  = useState<number>(600)
  const [fetchError,   setFetchError]   = useState<string | null>(null)
  const expired = secondsLeft <= 0

  // Create PaymentIntent on mount
  useEffect(() => {
    fetch('/api/stripe/payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, tierId, quantity }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setFetchError(data.error); return }
        setClientSecret(data.clientSecret)
        setExpiresAt(data.expiresAt)
        setSecondsLeft(data.expiresAt - Math.floor(Date.now() / 1000))
      })
      .catch(() => setFetchError('No se pudo iniciar el pago. Intenta de nuevo.'))
  }, [eventId, tierId, quantity])

  // Countdown ticker
  useEffect(() => {
    if (!expiresAt) return
    const id = setInterval(() => {
      setSecondsLeft(expiresAt - Math.floor(Date.now() / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  // Warn before leaving while a payment window is open
  useEffect(() => {
    if (!clientSecret || expired) return
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [clientSecret, expired])

  if (fetchError) {
    return (
      <div
        className="rounded-xl p-5 text-center space-y-2"
        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <AlertCircle size={24} className="mx-auto text-red-400" />
        <p className="text-sm text-red-400">{fetchError}</p>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-8 gap-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Preparando pago seguro…</span>
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary:     '#f97316',
            colorBackground:  '#1a1025',
            colorText:        'rgba(255,255,255,0.9)',
            colorTextSecondary: 'rgba(255,255,255,0.45)',
            borderRadius:     '12px',
            fontFamily:       'inherit',
          },
        },
        locale: 'es-419',
      }}
    >
      <InnerForm
        totalLabel={totalLabel}
        secondsLeft={Math.max(0, secondsLeft)}
        expired={expired}
        eventId={eventId}
      />
    </Elements>
  )
}
