import type { SupabaseClient } from '@supabase/supabase-js'
import { applyDiscount, type DiscountInput, type DiscountApplied } from './pricing'

export type DiscountRow = {
  id:           string
  event_id:     string
  tier_id:      string | null
  name:         string
  code:         string | null
  kind:         'percent' | 'fixed' | 'bogo'
  percent_off:  number | null
  amount_off:   number | null
  buy_quantity: number | null
  get_quantity: number | null
  max_uses:     number | null
  used_count:   number
  expires_at:   string | null
  is_active:    boolean
}

export type TierDiscount = {
  id:    string
  label: string
  kind:  'percent' | 'fixed' | 'bogo'
  code:  string | null
}

export function discountToInput(d: DiscountRow): DiscountInput {
  if (d.kind === 'percent') return { kind: 'percent', percentOff: d.percent_off! }
  if (d.kind === 'fixed')   return { kind: 'fixed',   amountOff: d.amount_off! }
  return { kind: 'bogo', buyQuantity: d.buy_quantity!, getQuantity: d.get_quantity! }
}

export function discountLabel(d: DiscountRow): string {
  if (d.kind === 'percent') return `${d.percent_off}% OFF`
  if (d.kind === 'fixed')   return `$${d.amount_off} OFF`
  const b = d.buy_quantity!
  const g = d.get_quantity!
  return b === 1 && g === 1 ? '2x1' : `${b + g}x${b}`
}

function isValid(d: DiscountRow): boolean {
  if (!d.is_active) return false
  if (d.expires_at && new Date(d.expires_at) <= new Date()) return false
  if (d.max_uses !== null && d.used_count >= d.max_uses) return false
  return true
}

// Returns a Map from tier_id (or null for event-wide) to the active public discount.
// Tier-specific discounts take precedence over event-wide when both exist.
export async function getPublicDiscountsForEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  eventId: string
): Promise<Map<string | null, DiscountRow>> {
  const { data } = await supabase
    .from('discounts')
    .select('*')
    .eq('event_id', eventId)
    .is('code', null)
    .eq('is_active', true)

  const map = new Map<string | null, DiscountRow>()
  if (!data) return map

  for (const d of data as DiscountRow[]) {
    if (!isValid(d)) continue
    const key = d.tier_id ?? null
    // Prefer tier-specific: only store event-wide (key=null) if no entry yet for that key
    if (!map.has(key)) map.set(key, d)
  }
  return map
}

export async function getPublicDiscountForTier(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  eventId: string,
  tierId: string
): Promise<DiscountRow | null> {
  const map = await getPublicDiscountsForEvent(supabase, eventId)
  return map.get(tierId) ?? map.get(null) ?? null
}

// Validates a private discount code for a given event/tier.
// Returns the discount row + input, or an error reason.
export async function validateDiscountCode(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  eventId: string,
  tierId: string,
  code: string
): Promise<
  | { ok: true;  discount: DiscountRow; input: DiscountInput }
  | { ok: false; reason: string }
> {
  const trimmed = code.trim().toUpperCase()
  if (!trimmed) return { ok: false, reason: 'Código vacío' }

  const { data } = await supabase
    .from('discounts')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_active', true)
    .ilike('code', trimmed)
    .limit(10)

  const rows = (data ?? []) as DiscountRow[]
  const match = rows.find(d => {
    if (!isValid(d)) return false
    // Must apply to this tier or to all tiers
    if (d.tier_id !== null && d.tier_id !== tierId) return false
    return true
  })

  if (!match) return { ok: false, reason: 'Código inválido o expirado' }

  return { ok: true, discount: match, input: discountToInput(match) }
}

// Builds the TierDiscount summary for tier cards (corner flag).
export function toTierDiscount(d: DiscountRow): TierDiscount {
  return { id: d.id, label: discountLabel(d), kind: d.kind, code: d.code }
}

// Applies a discount to a price/quantity and returns the effective amounts.
// Convenience wrapper that handles the DiscountRow → DiscountInput conversion.
export function applyDiscountRow(
  price: number,
  quantity: number,
  d: DiscountRow
): DiscountApplied {
  return applyDiscount(price, quantity, discountToInput(d))
}
