import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { CheckCircle, FileText, CreditCard, ArrowRight, ExternalLink } from 'lucide-react'
import FormButton from '@/components/form-button'
import { acceptTerms, startStripeOnboarding } from './actions'

export default async function OnboardingPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, terms_accepted_at, stripe_account_id, stripe_onboarding_complete')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'organizer') redirect('/dashboard')

  const termsAccepted  = !!profile?.terms_accepted_at
  const stripeComplete = !!profile?.stripe_onboarding_complete

  if (termsAccepted && stripeComplete) redirect('/dashboard/events')

  const step = !termsAccepted ? 1 : 2

  return (
    <div className="max-w-lg mx-auto space-y-8 py-4">

      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Configura tu cuenta de organizador</h1>
        <p className="text-zinc-500 mt-1">
          Completa estos pasos para publicar eventos y recibir pagos.
        </p>
      </div>

      <div className="space-y-4">

        {/* Paso 1 — Términos */}
        <div className={`rounded-2xl border p-6 transition-all ${
          termsAccepted
            ? 'bg-green-50 border-green-200'
            : 'bg-white border-zinc-200 shadow-sm'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              termsAccepted ? 'bg-green-600' : 'bg-zinc-900'
            }`}>
              {termsAccepted
                ? <CheckCircle size={20} className="text-white" />
                : <FileText size={20} className="text-white" />
              }
            </div>
            <div className="flex-1">
              <p className="font-semibold text-zinc-900">Paso 1 — Términos y condiciones</p>
              <p className="text-sm text-zinc-500 mt-0.5">
                Lee y acepta nuestros términos de uso y aviso de privacidad.
              </p>

              {termsAccepted ? (
                <p className="text-sm text-green-700 font-medium mt-3">Aceptados ✓</p>
              ) : step === 1 && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="/archivos/terminos.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
                    >
                      <ExternalLink size={13} />
                      Términos y condiciones
                    </a>
                    <a
                      href="/archivos/aviso.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
                    >
                      <ExternalLink size={13} />
                      Aviso de privacidad
                    </a>
                  </div>

                  <form action={acceptTerms}>
                    <label className="flex items-start gap-3 cursor-pointer mb-4">
                      <input
                        type="checkbox"
                        name="accepted"
                        required
                        className="mt-0.5 w-4 h-4 accent-zinc-900 cursor-pointer"
                      />
                      <span className="text-sm text-zinc-600 leading-snug">
                        He leído y acepto los{' '}
                        <a href="/archivos/terminos.pdf" target="_blank" className="underline hover:text-zinc-900">
                          términos y condiciones
                        </a>{' '}
                        y el{' '}
                        <a href="/archivos/aviso.pdf" target="_blank" className="underline hover:text-zinc-900">
                          aviso de privacidad
                        </a>{' '}
                        de Takilla.
                      </span>
                    </label>
                    <FormButton className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 flex items-center gap-2">
                      Aceptar y continuar
                      <ArrowRight size={15} />
                    </FormButton>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Paso 2 — Stripe Connect */}
        <div className={`rounded-2xl border p-6 transition-all ${
          stripeComplete
            ? 'bg-green-50 border-green-200'
            : step === 2
              ? 'bg-white border-zinc-200 shadow-sm'
              : 'bg-zinc-50 border-zinc-100 opacity-50 pointer-events-none'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              stripeComplete ? 'bg-green-600' : step === 2 ? 'bg-zinc-900' : 'bg-zinc-300'
            }`}>
              {stripeComplete
                ? <CheckCircle size={20} className="text-white" />
                : <CreditCard size={20} className="text-white" />
              }
            </div>
            <div className="flex-1">
              <p className="font-semibold text-zinc-900">Paso 2 — Cuenta de pagos</p>
              <p className="text-sm text-zinc-500 mt-0.5">
                Conecta tu cuenta bancaria para recibir los pagos de tus eventos directamente.
              </p>

              {stripeComplete ? (
                <p className="text-sm text-green-700 font-medium mt-3">Configurada ✓</p>
              ) : step === 2 && (
                <div className="mt-4 space-y-4">
                  <ul className="text-sm text-zinc-500 space-y-1">
                    <li>• Recibirás <strong className="text-zinc-800">100% del precio</strong> de tus boletos</li>
                    <li>• Los cargos por servicio los paga el comprador, no tú</li>
                    <li>• La verificación de identidad es segura y está a cargo de Stripe</li>
                  </ul>
                  <form action={startStripeOnboarding}>
                    <FormButton className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 flex items-center gap-2">
                      <CreditCard size={15} />
                      {profile?.stripe_account_id ? 'Continuar configuración' : 'Configurar cuenta de pagos'}
                      <ArrowRight size={15} />
                    </FormButton>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
