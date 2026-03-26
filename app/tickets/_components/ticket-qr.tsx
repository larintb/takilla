'use client'

import QRCode from 'react-qr-code'

type TicketQrProps = {
  qrHash: string
  size?: number
}

export default function TicketQr({ qrHash, size = 128 }: TicketQrProps) {
  return (
    <div className="bg-zinc-50 rounded-lg p-2 text-center space-y-1.5">
      <div className="bg-white rounded-md p-1.5 inline-block">
        <QRCode value={qrHash} size={size} viewBox="0 0 256 256" />
      </div>
      {size >= 100 && (
        <p className="text-[11px] text-zinc-400 font-mono truncate">{qrHash}</p>
      )}
    </div>
  )
}
