import { TierEffectKeyframes, goldBase, diamondBase } from './tier-effects'

type Props = {
  tierName: string
  tierEffect?: string | null
  eventTitle: string
  eventDate?: string | null
  ownerName?: string | null
  compact?: boolean
}

function effectStyle(effect: string | null | undefined): React.CSSProperties {
  if (effect === 'gold')    return { ...goldBase, animation: 'goldWave 3s ease infinite' }
  if (effect === 'diamond') return { ...diamondBase, animation: 'diamondWave 3s ease infinite' }
  return { background: 'var(--accent-gradient)' }
}

function cardShell(effect: string | null | undefined): React.CSSProperties {
  if (effect === 'gold')    return { boxShadow: '0 0 28px rgba(251,191,36,0.25)' }
  if (effect === 'diamond') return { boxShadow: '0 0 28px rgba(56,189,248,0.22)' }
  return { boxShadow: '0 0 28px rgba(249,115,22,0.2)' }
}

export default function TicketCard({ tierName, tierEffect, eventTitle, eventDate, ownerName, compact }: Props) {
  const dateStr = eventDate
    ? new Date(eventDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <>
      <TierEffectKeyframes />
      <div
        className="w-full rounded-2xl overflow-hidden"
        style={{
          maxWidth: compact ? 300 : 380,
          padding: '1.5px',
          background: effectStyle(tierEffect).backgroundImage ?? 'var(--accent-gradient)',
          ...cardShell(tierEffect),
        }}
      >
        {/* Gradient border wrapper */}
        <div style={{ ...effectStyle(tierEffect), padding: '1.5px', borderRadius: 'inherit', boxShadow: 'none' }}>
          <div
            className="w-full overflow-hidden rounded-[14px]"
            style={{ background: 'linear-gradient(160deg, #1e1040 0%, #110726 100%)' }}
          >
            {/* Header strip with effect gradient */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={effectStyle(tierEffect)}
            >
              <span className="font-bold text-sm tracking-[0.2em] uppercase opacity-90">★ Takilla</span>
              <span className="font-mono text-xs font-bold tracking-widest opacity-70">
                {tierName.toUpperCase()}
              </span>
            </div>

            {/* Body */}
            <div className="px-4 py-3 space-y-1.5">
              <p className="font-bold text-white leading-tight text-sm break-words" style={{ fontSize: compact ? '0.85rem' : '1rem' }}>
                {eventTitle}
              </p>
              {dateStr && (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{dateStr}</p>
              )}
              {ownerName && !compact && (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{ownerName}</p>
              )}
            </div>

            {/* Footer badge */}
            <div className="px-4 pb-3">
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                style={effectStyle(tierEffect)}
              >
                {tierName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
