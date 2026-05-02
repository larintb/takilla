import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/admin'
import { resolveEventImageUrl } from '@/utils/supabase/storage'

const resend = new Resend(process.env.RESEND)

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Por confirmar'
  return new Date(dateStr).toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildMapUrl(lat: number | null, lng: number | null): string | null {
  if (!lat || !lng) return null
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) return null
  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-l+fa1492(${lng},${lat})/${lng},${lat},13,0/560x240@2x?access_token=${token}`
}

function buildHtml(params: {
  fullName: string
  eventTitle: string
  eventDate: string | null
  locationName: string | null
  imageUrl: string | null
  mapUrl: string | null
}): string {
  const { fullName, eventTitle, eventDate, locationName, imageUrl, mapUrl } = params

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${eventTitle}</title>
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
            <td style="background-color:#1b1233;border-radius:16px;overflow:hidden;">

              ${imageUrl ? `
              <img src="${imageUrl}" alt="${eventTitle}" width="500" style="width:100%;height:220px;object-fit:cover;display:block;" />
              ` : ''}

              <div style="padding:32px 32px 36px;">

                <p style="margin:0 0 4px;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(244,241,255,0.4);">
                  Recordatorio de evento
                </p>
                <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#f4f1ff;">
                  Hola, ${fullName} 👋
                </h1>

                <!-- Event info box -->
                <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:rgba(255,255,255,0.04);border-radius:12px;padding:18px 20px;margin-bottom:24px;">
                  <tr>
                    <td>
                      <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#f4f1ff;">${eventTitle}</p>
                      <p style="margin:0 0 4px;font-size:13px;color:rgba(244,241,255,0.55);">📅 ${formatDate(eventDate)}</p>
                      ${locationName ? `<p style="margin:0;font-size:13px;color:rgba(244,241,255,0.4);">📍 ${locationName}</p>` : ''}
                    </td>
                  </tr>
                </table>

                ${mapUrl ? `
                <!-- Map -->
                <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:28px;">
                  <tr>
                    <td style="border-radius:12px;overflow:hidden;line-height:0;">
                      <img src="${mapUrl}" alt="Ubicación del evento" width="436" style="width:100%;display:block;border-radius:12px;" />
                    </td>
                  </tr>
                </table>
                ` : ''}

                <!-- CTA -->
                <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr>
                    <td align="center">
                      <a href="https://takilla.online/tickets" style="display:inline-block;background:linear-gradient(90deg,#ff6e01 0%,#fa1492 55%,#720d98 100%);color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:50px;">
                        Ver mis boletos
                      </a>
                    </td>
                  </tr>
                </table>

              </div>
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

export type ReminderResult = {
  sent: number
  failed: number
  skipped: number
  eventTitle: string
}

export async function sendEventReminder(eventId: string): Promise<ReminderResult> {
  const admin = createAdminClient()

  const { data: event } = await admin
    .from('events')
    .select('id, title, event_date, image_url, location_name, location_lat, location_lng')
    .eq('id', eventId)
    .single()

  if (!event) throw new Error('Evento no encontrado')

  const imageUrl = resolveEventImageUrl(admin, event.image_url)
  const mapUrl = buildMapUrl(
    event.location_lat as number | null,
    event.location_lng as number | null,
  )

  const { data: tickets } = await admin
    .from('tickets')
    .select('owner_id')
    .eq('event_id', eventId)

  if (!tickets?.length) {
    return { sent: 0, failed: 0, skipped: 0, eventTitle: event.title }
  }

  const ownerIds = [...new Set(tickets.map((t) => t.owner_id))]

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email, full_name')
    .in('id', ownerIds)

  if (!profiles?.length) {
    return { sent: 0, failed: 0, skipped: 0, eventTitle: event.title }
  }

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const profile of profiles) {
    if (!profile.email) { skipped++; continue }

    const { error } = await resend.emails.send({
      from: 'Takilla <contacto@takilla.online>',
      to: profile.email,
      subject: `¡Te esperamos en ${event.title}!`,
      html: buildHtml({
        fullName: profile.full_name ?? 'Amigo',
        eventTitle: event.title,
        eventDate: event.event_date,
        locationName: (event.location_name as string | null) ?? null,
        imageUrl,
        mapUrl,
      }),
    })

    if (error) { failed++ } else { sent++ }
  }

  return { sent, failed, skipped, eventTitle: event.title }
}

export async function sendTestReminder(
  eventId: string,
  toEmail: string,
  fullName: string,
): Promise<void> {
  const admin = createAdminClient()

  const { data: event } = await admin
    .from('events')
    .select('id, title, event_date, image_url, location_name, location_lat, location_lng')
    .eq('id', eventId)
    .single()

  if (!event) throw new Error('Evento no encontrado')

  const imageUrl = resolveEventImageUrl(admin, event.image_url)
  const mapUrl = buildMapUrl(
    event.location_lat as number | null,
    event.location_lng as number | null,
  )

  const { error } = await resend.emails.send({
    from: 'Takilla <contacto@takilla.online>',
    to: toEmail,
    subject: `[PRUEBA] ¡Te esperamos en ${event.title}!`,
    html: buildHtml({
      fullName,
      eventTitle: event.title,
      eventDate: event.event_date,
      locationName: (event.location_name as string | null) ?? null,
      imageUrl,
      mapUrl,
    }),
  })

  if (error) throw new Error(`Resend error: ${error.message}`)
}
