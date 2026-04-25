import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND)
const FORWARD_TO = 'vlpizana@gmail.com'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Missing RESEND_WEBHOOK_SECRET' }, { status: 500 })
  }

  const svixId        = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const svixSignature = request.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const body = await request.text()

  let event: { type: string; data: { email_id: string; from: string; to: string[]; subject: string } }
  try {
    event = resend.webhooks.verify({
      payload: body,
      headers: {
        id:        svixId,
        timestamp: svixTimestamp,
        signature: svixSignature,
      },
      webhookSecret,
    }) as typeof event
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  if (event.type !== 'email.received') {
    return NextResponse.json({ received: true })
  }

  const { email_id, from, subject } = event.data

  const { data: email, error: fetchError } = await resend.emails.receiving.get(email_id)
  if (fetchError || !email) {
    console.error('[email/receive] Error fetching received email:', fetchError)
    return NextResponse.json({ error: 'Failed to fetch email content' }, { status: 500 })
  }

  const bodyHtml = email.html
  const bodyText = email.text

  await resend.emails.send({
    from:    'Takilla Contacto <contacto@takilla.online>',
    to:      FORWARD_TO,
    subject: `[contacto] ${subject ?? '(sin asunto)'}`,
    html:    bodyHtml ?? `<pre>${bodyText ?? ''}</pre>`,
    text:    bodyText ?? undefined,
    replyTo: from,
  })

  console.log(`[email/receive] Forwarded email ${email_id} from ${from} → ${FORWARD_TO}`)
  return NextResponse.json({ received: true })
}
