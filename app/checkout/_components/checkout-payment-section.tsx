'use client'

import { useState } from 'react'
import DiscountInput from './discount-input'
import PaymentForm from './payment-form'

export default function CheckoutPaymentSection({
  price,
  eventId,
  tierId,
  quantity,
  perksCsv,
  perkIds,
  currentCode,
  codeError,
  totalLabel,
  discountCode,
  autoDiscountId,
}: {
  price:          number
  eventId:        string
  tierId:         string
  quantity:       number
  perksCsv:       string
  perkIds:        string[]
  currentCode:    string | null
  codeError:      string | null
  totalLabel:     string
  discountCode:   string | null
  autoDiscountId: string | null
}) {
  const [piStarted, setPiStarted] = useState(false)

  return (
    <>
      {price > 0 && (
        <div className="px-6 pb-4">
          <DiscountInput
            eventId={eventId}
            tierId={tierId}
            quantity={quantity}
            perksCsv={perksCsv}
            currentCode={currentCode}
            codeError={codeError}
            locked={piStarted}
          />
        </div>
      )}

      <div className="px-6 pb-6 space-y-3">
        <PaymentForm
          eventId={eventId}
          tierId={tierId}
          quantity={quantity}
          perkIds={perkIds}
          totalLabel={totalLabel}
          discountCode={discountCode}
          autoDiscountId={autoDiscountId}
          onStart={() => setPiStarted(true)}
        />
      </div>
    </>
  )
}
