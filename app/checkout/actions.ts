'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { stripe } from '@/utils/stripe/server'
import { calculateFees, calculatePerkFees } from '@/utils/pricing'
import { isEventOver } from '@/utils/event-time'

function getBaseUrl(headerStore: Awaited<ReturnType<typeof headers>>) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')

  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http'
  return `${protocol}://${host}`
}

export async function startStripeCheckout(formData: FormData) {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tierId   = (formData.get('tierId') as string | null)?.trim()
  const eventId  = (formData.get('eventId') as string | null)?.trim()
  const quantityRaw = Number(formData.get('quantity'))
  const quantity = Number.isInteger(quantityRaw) ? quantityRaw : 1
  const perksCsv = (formData.get('perks') as string | null)?.trim() || ''
  const perkIds  = perksCsv ? perksCsv.split(',').map(s => s.trim()).filter(Boolean) : []

  if (!tierId || !eventId) throw new Error('Faltan datos del checkout')
  if (quantity < 1 || quantity > 10) throw new Error('Cantidad inválida')

  const { data: tier } = await supabase
    .from('ticket_tiers')
    .select('id, name, price, available_tickets, event_id, events(title, status, event_date, event_end_date, organizer_id)')
    .eq('id', tierId)
    .eq('event_id', eventId)
    .single()

  if (!tier) throw new Error('Tier no encontrado')
  if (tier.available_tickets < quantity) throw new Error('No hay boletos suficientes')

  const event = Array.isArray(tier.events)
    ? (tier.events[0] as { title: string; status: string; event_date: string; event_end_date?: string | null; organizer_id: string } | undefined)
    : (tier.events as { title: string; status: string; event_date: string; event_end_date?: string | null; organizer_id: string } | null)
  if (!event || event.status !== 'published') throw new Error('El evento no está disponible')
  if (isEventOver(event.event_date, event.event_end_date)) throw new Error('El evento ya pasó')

  const priceNumber = Number(tier.price)

  if (priceNumber === 0) {
    for (let i = 0; i < quantity; i++) {
      const { error } = await supabase.rpc('purchase_ticket', {
        tier_id_input: tierId,
      })
      if (error) throw new Error(error.message)
    }
    // Handle bundled free perks
    if (perkIds.length > 0) {
      const supabaseAdmin = createAdminClient()
      const { error: perkError } = await supabaseAdmin.rpc('purchase_perks_free', {
        p_user_id:  user.id,
        p_event_id: eventId,
        p_perk_ids: perkIds,
      })
      if (perkError) {
        console.error('[checkout] purchase_perks_free error:', perkError.message)
      }
    }
    redirect('/tickets')
  }

  // Obtener cuenta de Stripe del organizador — usa admin client para saltar RLS,
  // ya que un customer no puede leer el perfil de otro usuario.
  const supabaseAdmin = createAdminClient()
  const { data: organizer } = await supabaseAdmin
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete')
    .eq('id', event.organizer_id)
    .single()

  if (!organizer?.stripe_onboarding_complete || !organizer?.stripe_account_id) {
    throw new Error('El organizador aún no ha configurado su cuenta de pagos')
  }

  const fees = calculateFees(priceNumber, quantity)

  // Stripe MXN: mínimo 10 MXN (1000 centavos) por transacción
  if (fees.unitAmountCentavos < 1000) {
    throw new Error('El precio del boleto es menor al mínimo permitido por Stripe para pagos en MXN')
  }

  // Validar y calcular perks si los hay
  type PerkFeeRow = { id: string; name: string; unitAmountCentavos: number; appFeeCentavos: number }
  const perkFeeRows: PerkFeeRow[] = []
  let totalPerkAppFeeCentavos = 0
  let perkIdCsv = ''

  if (perkIds.length > 0) {
    const uniqueIds = [...new Set(perkIds)]
    const supabaseAdmin2 = createAdminClient()
    const { data: perksData } = await supabaseAdmin2
      .from('perks')
      .select('id, name, price')
      .in('id', uniqueIds)
      .eq('event_id', eventId)

    if (perksData) {
      const priceMap = new Map(perksData.map(p => [p.id, { name: p.name, price: Number(p.price) }]))
      for (const perkId of perkIds) {
        const perk = priceMap.get(perkId)
        if (!perk || perk.price === 0) continue
        const pFees = calculatePerkFees(perk.price, 1)
        perkFeeRows.push({ id: perkId, name: perk.name, unitAmountCentavos: pFees.unitAmountCentavos, appFeeCentavos: pFees.applicationFeeAmountCentavos })
        totalPerkAppFeeCentavos += pFees.applicationFeeAmountCentavos
      }
      perkIdCsv = perkIds.join(',')
    }
  }

  const baseUrl = getBaseUrl(headerStore)
  const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${baseUrl}/checkout?eventId=${eventId}&tierId=${tierId}&quantity=${quantity}`

  // Agrupar perks por línea (misma id → mismo line_item con quantity)
  const perkLineItems: { quantity: number; price_data: { currency: string; unit_amount: number; product_data: { name: string } } }[] = []
  const perkQtyMap = new Map<string, { qty: number; unitCents: number; name: string }>()
  for (const row of perkFeeRows) {
    const existing = perkQtyMap.get(row.id)
    if (existing) existing.qty++
    else perkQtyMap.set(row.id, { qty: 1, unitCents: row.unitAmountCentavos, name: row.name })
  }
  for (const { qty, unitCents, name } of perkQtyMap.values()) {
    perkLineItems.push({ quantity: qty, price_data: { currency: 'mxn', unit_amount: unitCents, product_data: { name } } })
  }

  const metadata: Record<string, string> = {
    user_id:  user.id,
    event_id: eventId,
    tier_id:  tierId,
    quantity: String(quantity),
  }
  if (perkIdCsv) metadata.perk_ids = perkIdCsv

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: user.email ?? undefined,
    line_items: [
      {
        quantity,
        price_data: {
          currency: 'mxn',
          unit_amount: fees.unitAmountCentavos,
          product_data: {
            name: `${event.title} - ${tier.name}`,
            description: `Incluye cargo por servicio de $${fees.serviceChargePerTicket.toFixed(2)} MXN por boleto`,
          },
        },
      },
      ...perkLineItems,
    ],
    payment_intent_data: {
      application_fee_amount: fees.applicationFeeAmountCentavos + totalPerkAppFeeCentavos,
      transfer_data: {
        destination: organizer.stripe_account_id,
      },
    },
    metadata,
  })

  if (!session.url) {
    throw new Error('No se pudo iniciar Stripe Checkout')
  }

  redirect(session.url)
}
