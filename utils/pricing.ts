// Tarifa de Stripe para tarjetas domésticas México: 3.6% + $3.00 MXN
const STRIPE_PCT  = 0.036
const STRIPE_FLAT = 3.00

// IVA mexicano sobre la comisión de Stripe (16%)
const STRIPE_IVA = 0.16

// Tarifa de plataforma Takilla: 5% + $5.00 MXN
const PLATFORM_PCT  = 0.05
const PLATFORM_FLAT = 5.00

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
