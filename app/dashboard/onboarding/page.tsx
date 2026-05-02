import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { CheckCircle, FileText, CreditCard, ArrowRight, ExternalLink } from 'lucide-react'
import FormButton from '@/components/form-button'
import Link from 'next/link'
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

  const step = !termsAccepted ? 1 : 2

  return (
    <div className="max-w-lg mx-auto space-y-8 py-4">

      <div>
        <h1 className="text-2xl font-bold text-white">Configura tu cuenta de organizador</h1>
        <p className="text-purple-300/70 mt-1">
          Acepta los términos para crear eventos. Conecta tu cuenta de pagos solo si quieres cobrar por boletos.
        </p>
      </div>

      <div className="space-y-4">

        {/* Paso 1 — Términos */}
        <div className={`rounded-2xl border p-6 transition-all ${
          termsAccepted
            ? 'bg-green-900/20 border-green-700/40'
            : 'bg-white/5 border-purple-700/40'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              termsAccepted ? 'bg-green-600' : 'bg-purple-700'
            }`}>
              {termsAccepted
                ? <CheckCircle size={20} className="text-white" />
                : <FileText size={20} className="text-white" />
              }
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">Paso 1 — Términos y condiciones</p>
              <p className="text-sm text-purple-300/70 mt-0.5">
                Lee y acepta nuestros términos de uso y aviso de privacidad.
              </p>

              {termsAccepted ? (
                <p className="text-sm text-green-400 font-medium mt-3">Aceptados ✓</p>
              ) : step === 1 && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="/archivos/terminos.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-400 underline underline-offset-2 hover:text-orange-300"
                    >
                      <ExternalLink size={13} />
                      Términos y condiciones
                    </a>
                    <a
                      href="/archivos/aviso.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-400 underline underline-offset-2 hover:text-orange-300"
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
                        className="mt-0.5 w-4 h-4 accent-orange-500 cursor-pointer"
                      />
                      <span className="text-sm text-purple-300/80 leading-snug">
                        He leído y acepto los{' '}
                        <a href="/archivos/terminos.pdf" target="_blank" className="underline text-orange-400 hover:text-orange-300">
                          términos y condiciones
                        </a>{' '}
                        y el{' '}
                        <a href="/archivos/aviso.pdf" target="_blank" className="underline text-orange-400 hover:text-orange-300">
                          aviso de privacidad
                        </a>{' '}
                        de Takilla.
                      </span>
                    </label>
                    <FormButton
                      className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 hover:opacity-80 transition-opacity"
                      style={{ background: 'var(--accent-gradient)' }}
                    >
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
            ? 'bg-green-900/20 border-green-700/40'
            : step === 2
              ? 'bg-white/5 border-purple-700/40'
              : 'bg-white/[0.02] border-purple-700/20 opacity-50 pointer-events-none'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              stripeComplete ? 'bg-green-600' : step === 2 ? 'bg-purple-700' : 'bg-purple-900'
            }`}>
              {stripeComplete
                ? <CheckCircle size={20} className="text-white" />
                : <CreditCard size={20} className="text-white" />
              }
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-white">Paso 2 — Cuenta de pagos</p>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700/40">
                  Opcional — solo para eventos con cobro
                </span>
              </div>
              <p className="text-sm text-purple-300/70 mt-0.5">
                Conecta tu cuenta bancaria para cobrar por tus boletos. No es necesario para eventos gratuitos.
              </p>

              {stripeComplete ? (
                <p className="text-sm text-green-400 font-medium mt-3">Configurada ✓</p>
              ) : step === 2 && (
                <div className="mt-4 space-y-4">
                  <ul className="text-sm text-purple-300/70 space-y-1">
                    <li>• Recibirás <strong className="text-white">100% del precio</strong> de tus boletos</li>
                    <li>• Los cargos por servicio los paga el comprador, no tú</li>
                    <li>• La verificación de identidad es segura y está a cargo de Stripe</li>
                  </ul>
                  <div className="flex flex-wrap gap-3">
                    <form action={startStripeOnboarding}>
                      <FormButton
                        className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 hover:opacity-80 transition-opacity"
                        style={{ background: 'var(--accent-gradient)' }}
                      >
                        <CreditCard size={15} />
                        {profile?.stripe_account_id ? 'Continuar configuración' : 'Configurar cuenta de pagos'}
                        <ArrowRight size={15} />
                      </FormButton>
                    </form>
                    <Link
                      href="/dashboard"
                      className="px-5 py-2.5 rounded-xl border border-purple-700/40 text-purple-300 text-sm font-semibold hover:bg-white/5 flex items-center gap-2 transition-colors"
                    >
                      Ahora no, ir a mis eventos
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}