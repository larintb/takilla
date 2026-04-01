'use client'

import QRCode from 'react-qr-code'

type TicketQrProps = {
  qrHash: string
  size?: number
}

export default function TicketQr({ qrHash, size = 128 }: TicketQrProps) {
  return (
    <QRCode value={qrHash} size={size} viewBox="0 0 256 256" />
  )
}
