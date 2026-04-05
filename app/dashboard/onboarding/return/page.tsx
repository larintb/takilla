import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { stripe } from '@/utils/stripe/server'
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import FormButton from '@/components/form-button'
import { startStripeOnboarding } from '../actions'

export default async function OnboardingReturnPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, stripe_account_id, stripe_onboarding_complete')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'organizer') redirect('/dashboard')
  if (!profile?.stripe_account_id) redirect('/dashboard/onboarding')
  if (profile?.stripe_onboarding_complete) redirect('/dashboard/events')

  // Verificar el estado real de la cuenta en Stripe
  let isComplete = false
  try {
    const account = await stripe.accounts.retrieve(profile.stripe_account_id)
    isComplete = !!(account.charges_enabled && account.payouts_enabled)

    if (isComplete) {
      const supabaseAdmin = createAdminClient()
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_onboarding_complete: true })
        .eq('id', user.id)
    }
  } catch (err) {
    console.error('[onboarding/return] Error verificando cuenta Stripe:', err)
  }

  if (isComplete) {
    return (
      <div className="max-w-lg mx-auto py-4">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center space-y-4">
          <CheckCircle size={48} className="text-green-600 mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-zinc-900">¡Cuenta configurada!</h2>
            <p className="text-zinc-500 mt-1 text-sm">
              Tu cuenta de pagos está lista. Ya puedes crear y publicar eventos.
            </p>
          </div>
          <Link
            href="/dashboard/events/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors"
          >
            Crear mi primer evento
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center space-y-4">
        <AlertCircle size={48} className="text-amber-500 mx-auto" />
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Configuración incompleta</h2>
          <p className="text-zinc-500 mt-1 text-sm">
            Aún falta completar algunos pasos en Stripe para activar tu cuenta de pagos.
          </p>
        </div>
        <form action={startStripeOnboarding}>
          <FormButton className="px-6 py-3 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 flex items-center gap-2 mx-auto">
            Continuar configuración
            <ArrowRight size={15} />
          </FormButton>
        </form>
      </div>
    </div>
  )
}
