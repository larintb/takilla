// Tarifa de Stripe para tarjetas domésticas México: 3.6% + $3.00 MXN
const STRIPE_PCT  = 0.036
const STRIPE_FLAT = 3.00

// Tarifa de plataforma Takilla: 5% + $5.00 MXN
const PLATFORM_PCT  = 0.05
const PLATFORM_FLAT = 5.00

export interface FeeBreakdown {
  ticketPrice:          number  // precio que fijó el organizador
  platformFeePerTicket: number  // cargo Takilla
  stripeFeePerTicket:   number  // cargo Stripe (estimado)
  serviceChargePerTicket: number  // total cargo = platform + stripe
  unitTotal:            number  // lo que paga el comprador por 1 boleto
  totalAmount:          number  // unitTotal * quantity
  transferAmount:       number  // centavos a transferir al organizador (precio * qty exacto)
  unitAmountCentavos:   number  // unitTotal en centavos para Stripe
}

/**
 * Calcula el desglose de cargos para un boleto de pago.
 * - El comprador paga: precio del boleto + cargo Takilla + cargo Stripe (estimado)
 * - El organizador recibe: exactamente el precio del boleto × cantidad
 * - Takilla retiene: cargo de plataforma
 * - Stripe cobra: su fee del total
 *
 * Solo aplica a boletos con precio > 0. Para boletos gratis no uses esta función.
 */
export function calculateFees(ticketPrice: number, quantity: number): FeeBreakdown {
  const platformFeePerTicket  = ticketPrice * PLATFORM_PCT + PLATFORM_FLAT
  const stripeFeePerTicket    = ticketPrice * STRIPE_PCT   + STRIPE_FLAT
  const serviceChargePerTicket = platformFeePerTicket + stripeFeePerTicket
  const unitTotal             = ticketPrice + serviceChargePerTicket
  const totalAmount           = unitTotal * quantity

  return {
    ticketPrice,
    platformFeePerTicket:   Math.round(platformFeePerTicket   * 100) / 100,
    stripeFeePerTicket:     Math.round(stripeFeePerTicket     * 100) / 100,
    serviceChargePerTicket: Math.round(serviceChargePerTicket * 100) / 100,
    unitTotal:              Math.round(unitTotal              * 100) / 100,
    totalAmount:            Math.round(totalAmount            * 100) / 100,
    transferAmount:         Math.round(ticketPrice * quantity * 100),  // centavos exactos
    unitAmountCentavos:     Math.round(unitTotal              * 100),  // centavos para Stripe
  }
}
