// Tarifa de Stripe para tarjetas domésticas México: 3.6% + $3.00 MXN
const STRIPE_PCT  = 0.036
const STRIPE_FLAT = 3.00

// IVA mexicano sobre la comisión de Stripe (16%)
const STRIPE_IVA = 0.16

// Tarifa de plataforma Takilla: boletos 5% + $5.00 MXN | perks solo 5%
const PLATFORM_PCT  = 0.05
const PLATFORM_FLAT = 5.00

export interface PerkFeeBreakdown {
  perkPrice:   number
  platformFee: number  // 5% del precio del perk por unidad
  unitTotal:   number  // perkPrice × 1.05
  totalAmount: number  // unitTotal × quantity
  applicationFeeAmountCentavos: number  // 5% en centavos × quantity
  unitAmountCentavos: number
}

/**
 * Calcula el costo de un perk para el comprador: 5% de plataforma (sin $5 flat),
 * más gross-up del fee de Stripe para que el organizador reciba exactamente perkPrice
 * y Takilla nete exactamente el 5%.
 *
 * Misma ecuación circular que calculateFees pero con PLATFORM_FLAT = 0:
 *   T = (perkPrice + 5%×perkPrice + STRIPE_FLAT×1.16) / (1 - STRIPE_PCT×1.16)
 */
export function calculatePerkFees(perkPrice: number, quantity: number): PerkFeeBreakdown {
  const platformFeePerPerk = perkPrice * PLATFORM_PCT  // 5%, sin flat

  const stripeIvaFactor = 1 + STRIPE_IVA
  const numerator   = perkPrice + platformFeePerPerk + STRIPE_FLAT * stripeIvaFactor
  const denominator = 1 - STRIPE_PCT * stripeIvaFactor
  const unitTotal   = numerator / denominator

  const stripeFeePerPerk = (unitTotal * STRIPE_PCT + STRIPE_FLAT) * stripeIvaFactor
  const totalAmount      = unitTotal * quantity

  return {
    perkPrice,
    platformFee:   Math.round(platformFeePerPerk * 100) / 100,
    unitTotal:     Math.round(unitTotal           * 100) / 100,
    totalAmount:   Math.round(totalAmount         * 100) / 100,
    applicationFeeAmountCentavos: Math.round((platformFeePerPerk + stripeFeePerPerk) * quantity * 100),
    unitAmountCentavos:           Math.round(unitTotal * 100),
  }
}

export interface FeeBreakdown {
  ticketPrice:          number  // precio que fijó el organizador
  platformFeePerTicket: number  // cargo Takilla
  stripeFeePerTicket:   number  // cargo Stripe con IVA incluido
  serviceChargePerTicket: number  // total cargo = platform + stripe
  unitTotal:            number  // lo que paga el comprador por 1 boleto
  totalAmount:          number  // unitTotal * quantity
  applicationFeeAmountCentavos: number  // cargo de plataforma en centavos (para Stripe "Collected fees")
  unitAmountCentavos:   number  // unitTotal en centavos para Stripe
}

/**
 * Calcula el desglose de cargos para un boleto de pago.
 *
 * Stripe cobra su fee sobre el TOTAL cobrado (no solo el precio del boleto)
 * y además aplica 16% IVA sobre esa comisión. Esto genera una ecuación circular:
 *
 *   T = ticketPrice + platformFee + (T × STRIPE_PCT + STRIPE_FLAT) × (1 + STRIPE_IVA)
 *
 * Despejando T:
 *   T = (ticketPrice + platformFee + STRIPE_FLAT × (1 + STRIPE_IVA))
 *       / (1 - STRIPE_PCT × (1 + STRIPE_IVA))
 *
 * Así Takilla siempre recibe exactamente platformFee sin importar el monto.
 *
 * Solo aplica a boletos con precio > 0. Para boletos gratis no uses esta función.
 */
export function calculateFees(ticketPrice: number, quantity: number): FeeBreakdown {
  const platformFeePerTicket = ticketPrice * PLATFORM_PCT + PLATFORM_FLAT

  // Factor IVA sobre tarifa Stripe
  const stripeIvaFactor = 1 + STRIPE_IVA  // 1.16

  // Resolver la ecuación circular algebraicamente
  // T × (1 - STRIPE_PCT × stripeIvaFactor) = ticketPrice + platformFee + STRIPE_FLAT × stripeIvaFactor
  const numerator   = ticketPrice + platformFeePerTicket + STRIPE_FLAT * stripeIvaFactor
  const denominator = 1 - STRIPE_PCT * stripeIvaFactor
  const unitTotal   = numerator / denominator

  // Stripe fee real sobre el total (con IVA)
  const stripeFeePerTicket     = (unitTotal * STRIPE_PCT + STRIPE_FLAT) * stripeIvaFactor
  const serviceChargePerTicket = platformFeePerTicket + stripeFeePerTicket
  const totalAmount            = unitTotal * quantity

  return {
    ticketPrice,
    platformFeePerTicket:   Math.round(platformFeePerTicket   * 100) / 100,
    stripeFeePerTicket:     Math.round(stripeFeePerTicket     * 100) / 100,
    serviceChargePerTicket: Math.round(serviceChargePerTicket * 100) / 100,
    unitTotal:              Math.round(unitTotal              * 100) / 100,
    totalAmount:            Math.round(totalAmount            * 100) / 100,
    // Stripe transfiere (unitTotal - applicationFee) al organizador.
    // applicationFee = platformFee + stripeFee → organizer recibe exactamente ticketPrice.
    // Takilla neto = platformFee (stripeFee ya está en applicationFee y Stripe lo cobra).
    applicationFeeAmountCentavos: Math.round((platformFeePerTicket + stripeFeePerTicket) * quantity * 100),
    unitAmountCentavos:           Math.round(unitTotal * 100),
  }
}

// ─── Discount helpers ─────────────────────────────────────────────────────────

export type DiscountInput =
  | { kind: 'percent'; percentOff: number }
  | { kind: 'fixed';   amountOff: number }
  | { kind: 'bogo';    buyQuantity: number; getQuantity: number }

export interface DiscountApplied {
  effectivePrice: number  // precio por boleto ya descontado, para pasar a calculateFees
  freeTickets:    number  // solo BOGO: cuántos boletos no se cobran
  totalDiscount:  number  // ahorro total en MXN (para mostrar al comprador)
  label:          string  // "20% OFF" / "$50 OFF" / "2x1"
}

export function applyDiscount(price: number, quantity: number, d: DiscountInput): DiscountApplied {
  if (d.kind === 'percent') {
    const effectivePrice = price * (1 - d.percentOff / 100)
    return {
      effectivePrice,
      freeTickets: 0,
      totalDiscount: (price - effectivePrice) * quantity,
      label: `${d.percentOff}% OFF`,
    }
  }

  if (d.kind === 'fixed') {
    const effectivePrice = Math.max(0, price - d.amountOff)
    return {
      effectivePrice,
      freeTickets: 0,
      totalDiscount: Math.min(d.amountOff, price) * quantity,
      label: `$${d.amountOff} OFF`,
    }
  }

  // bogo: every (buy + get) group, user pays for `buy` tickets
  const groupSize   = d.buyQuantity + d.getQuantity
  const fullGroups  = Math.floor(quantity / groupSize)
  const remainder   = quantity % groupSize
  const paidTickets = fullGroups * d.buyQuantity + Math.min(remainder, d.buyQuantity)
  const freeTickets = quantity - paidTickets
  const effectivePrice = freeTickets > 0 ? (price * paidTickets) / quantity : price
  const label =
    d.buyQuantity === 1 && d.getQuantity === 1
      ? '2x1'
      : `${d.buyQuantity + d.getQuantity}x${d.buyQuantity}`
  return {
    effectivePrice,
    freeTickets,
    totalDiscount: price * freeTickets,
    label,
  }
}
