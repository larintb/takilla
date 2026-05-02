import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/admin'

const resend = new Resend(process.env.RESEND)

type TicketRow = {
  id: string
  qr_hash: string
  eventTitle: string
  eventDate: string | null
  venueName: string | null
  venueCity: string | null
  tierName: string | null
  tierPrice: number | null
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Por confirmar'
  return new Date(dateStr).toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function ticketDisplayNumber(id: string): string {
  const hex = id.replace(/-/g, '').slice(0, 8)
  const num = (parseInt(hex, 16) % 9000) + 1000
  return String(num)
}

function buildHtml(fullName: string, tickets: TicketRow[]): string {
  const first = tickets[0]
  const total = tickets.reduce((sum, t) => sum + (t.tierPrice ?? 0), 0)
  const totalFormatted = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(total)

  const ticketRows = tickets
    .map(
      (t) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#d1cbe8;">
        Boleto #${ticketDisplayNumber(t.id)}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#d1cbe8;text-align:right;">
        ${t.tierName ?? ''}
        ${t.tierPrice != null ? `· ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(t.tierPrice)}` : ''}
      </td>
    </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de compra</title>
</head>
<body style="margin:0;padding:0;background-color:#140a2a;color:#f4f1ff;font-family:Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#140a2a;width:100%;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:500px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <span style="font-size:24px;font-weight:700;color:#fa1492;">Takilla</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#1b1233;border-radius:16px;padding:36px 32px;">

              <p style="margin:0 0 4px;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(244,241,255,0.4);">
                ¡Compra confirmada!
              </p>
              <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#f4f1ff;">
                Hola, ${fullName} 👋
              </h1>

              <!-- Event info -->
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:rgba(255,255,255,0.04);border-radius:12px;padding:18px 20px;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 2px;font-size:17px;font-weight:700;color:#f4f1ff;">${first.eventTitle}</p>
                    <p style="margin:0 0 2px;font-size:13px;color:rgba(244,241,255,0.55);">${formatDate(first.eventDate)}</p>
                    ${first.venueName ? `<p style="margin:0;font-size:13px;color:rgba(244,241,255,0.4);">${first.venueName}${first.venueCity ? `, ${first.venueCity}` : ''}</p>` : ''}
                  </td>
                </tr>
              </table>

              <!-- Ticket list -->
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:20px;">
                ${ticketRows}
                <tr>
                  <td style="padding-top:14px;font-size:14px;font-weight:700;color:#f4f1ff;">Total</td>
                  <td style="padding-top:14px;font-size:14px;font-weight:700;color:#fa1492;text-align:right;">${totalFormatted}</td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:rgba(244,241,255,0.35);line-height:1.6;">
                Tus boletos ya están disponibles en la app. Preséntalo en la entrada del evento para tu acceso.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:rgba(244,241,255,0.2);">
                © 2026 Takilla · Todos los derechos reservados
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendPurchaseConfirmation(userId: string, orderId: string) {
  try {
    const admin = createAdminClient()

    // Atomically claim the send slot — if already sent, bail out immediately
    const { data: claimed } = await admin
      .from('orders')
      .update({ confirmation_email_sent: true })
      .eq('id', orderId)
      .eq('confirmation_email_sent', false)
      .select('id')

    if (!claimed || claimed.length === 0) return

    const [{ data: profile }, { data: rawTickets }] = await Promise.all([
      admin.from('profiles').select('email, full_name').eq('id', userId).single(),
      admin.from('tickets').select('id, qr_hash, tier_id, event_id').eq('order_id', orderId),
    ])

    if (!profile?.email || !rawTickets?.length) return

    const tierIds  = [...new Set(rawTickets.map((t) => t.tier_id))]
    const eventIds = [...new Set(rawTickets.map((t) => t.event_id))]

    const [{ data: tiers }, { data: events }] = await Promise.all([
      admin.from('ticket_tiers').select('id, name, price').in('id', tierIds),
      admin.from('events').select('id, title, event_date, venue_id').in('id', eventIds),
    ])

    const venueIds = [...new Set((events ?? []).map((e) => e.venue_id).filter((id): id is string => !!id))]
    const { data: venues } = venueIds.length
      ? await admin.from('venues').select('id, name, city').in('id', venueIds)
      : { data: [] as { id: string; name: string; city: string }[] }

    const tierMap  = new Map((tiers  ?? []).map((t) => [t.id, t]))
    const venueMap = new Map((venues ?? []).map((v) => [v.id, v]))
    const eventMap = new Map((events ?? []).map((e) => [e.id, { ...e, venue: e.venue_id ? (venueMap.get(e.venue_id) ?? null) : null }]))

    const tickets: TicketRow[] = rawTickets.map((t) => {
      const ev   = eventMap.get(t.event_id) ?? null
      const tier = tierMap.get(t.tier_id)   ?? null
      return {
        id:         t.id,
        qr_hash:    t.qr_hash,
        eventTitle: ev?.title ?? 'Evento',
        eventDate:  ev?.event_date ?? null,
        venueName:  (ev?.venue as { name: string; city: string } | null)?.name ?? null,
        venueCity:  (ev?.venue as { name: string; city: string } | null)?.city ?? null,
        tierName:   tier?.name ?? null,
        tierPrice:  tier ? Number(tier.price) : null,
      }
    })

    const fullName = profile.full_name ?? 'Amigo'
    const subject  = tickets[0]
      ? `Tus boletos para ${tickets[0].eventTitle} están listos`
      : 'Confirmación de tu compra en Takilla'

    await resend.emails.send({
      from: 'Takilla <contacto@takilla.online>',
      to:   profile.email,
      subject,
      html: buildHtml(fullName, tickets),
    })
  } catch (err) {
    console.error('[email] Error enviando confirmación de compra:', err)
  }
}
