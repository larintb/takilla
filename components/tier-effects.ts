import React from 'react'

// ── Base shimmer gradient objects ─────────────────────────────────────────────

export const goldBase: React.CSSProperties = {
  backgroundImage: 'linear-gradient(135deg, #78350f, #b45309, #d97706, #fbbf24, #d97706, #b45309, #78350f)',
  backgroundSize: '300% 300%',
  backgroundRepeat: 'no-repeat',
  animation: 'goldWave 3s ease infinite',
  color: '#fef3c7',
  textShadow: '0 1px 3px rgba(0,0,0,0.6)',
  border: 'none',
  boxShadow: '0 0 16px rgba(251,191,36,0.35)',
}

export const goldStyle: React.CSSProperties = { ...goldBase }

export const diamondBase: React.CSSProperties = {
  backgroundImage: 'linear-gradient(135deg, #0c4a6e, #0369a1, #0ea5e9, #7dd3fc, #0ea5e9, #0369a1, #0c4a6e)',
  backgroundSize: '300% 300%',
  backgroundRepeat: 'no-repeat',
  animation: 'diamondWave 3s ease infinite',
  color: '#e0f2fe',
  textShadow: '0 1px 3px rgba(0,0,0,0.6)',
  border: 'none',
  boxShadow: '0 0 16px rgba(56,189,248,0.35)',
}

export const diamondStyle: React.CSSProperties = { ...diamondBase }

// ── Keyframes string (inject once per page) ───────────────────────────────────

export const tierEffectKeyframesCSS = `
  @keyframes goldWave    { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
  @keyframes diamondWave { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
  @keyframes accentWave  { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
`

export function TierEffectKeyframes(): React.ReactElement {
  return React.createElement('style', null, tierEffectKeyframesCSS)
}

// ── Generic per-effect style helpers ─────────────────────────────────────────

export function tierBorderStyle(
  effect: string | null | undefined,
  isSelected: boolean,
  soldOut?: boolean
): React.CSSProperties {
  if (!isSelected) {
    return {
      border: '1px solid var(--color-deep-purple)',
      opacity: soldOut ? 0.45 : 0.8,
      boxShadow: 'none',
    }
  }
  if (effect === 'gold')    return { border: '1px solid rgba(251,191,36,0.6)', boxShadow: '0 4px 20px rgba(251,191,36,0.2)', opacity: 1 }
  if (effect === 'diamond') return { border: '1px solid rgba(56,189,248,0.6)', boxShadow: '0 4px 20px rgba(56,189,248,0.2)', opacity: 1 }
  return { border: '1px solid var(--color-pink)', boxShadow: '0 4px 20px rgba(250,20,146,0.15)', opacity: 1 }
}

export function tierPriceTextStyle(
  effect: string | null | undefined,
  isSelected: boolean
): React.CSSProperties {
  if (!isSelected) return { color: 'rgba(255,255,255,0.4)' }
  if (effect === 'gold')    return { background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }
  if (effect === 'diamond') return { background: 'linear-gradient(90deg, #7dd3fc, #38bdf8, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }
  return { color: 'var(--color-orange)' }
}

export function tierCheckColor(effect: string | null | undefined, isSelected: boolean): string {
  if (!isSelected) return 'var(--color-deep-purple)'
  if (effect === 'gold')    return '#fbbf24'
  if (effect === 'diamond') return '#7dd3fc'
  return 'var(--color-pink)'
}

export function tierCtaStyle(effect: string | null | undefined): React.CSSProperties {
  if (effect === 'gold')    return { ...goldStyle, borderRadius: '1rem', fontSize: '1rem' }
  if (effect === 'diamond') return { ...diamondStyle, borderRadius: '1rem', fontSize: '1rem' }
  return { background: 'var(--accent-gradient)', boxShadow: '0 0 28px rgba(249,115,22,0.28)' }
}

// ── Discount corner-flag badge ────────────────────────────────────────────────
// Rendered as an absolute-positioned <span> in the top-right corner of a tier card.

export const discountFlagStyle: React.CSSProperties = {
  background: 'var(--accent-gradient)',
  backgroundSize: '200% 200%',
  animation: 'accentWave 3s ease infinite',
  color: '#ffffff',
  textShadow: '0 1px 2px rgba(0,0,0,0.4)',
  boxShadow: '0 4px 12px rgba(250,20,146,0.35)',
}

// ── Badge style for small tier badges (organizer dashboard) ───────────────────

export const tierEffectBadge: Record<string, React.CSSProperties> = {
  gold: {
    backgroundImage: 'linear-gradient(135deg, #78350f, #b45309, #d97706, #fbbf24, #d97706, #b45309)',
    backgroundSize: '200% 200%',
    animation: 'goldWave 3s ease infinite',
    color: '#fef3c7',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  },
  diamond: {
    backgroundImage: 'linear-gradient(135deg, #0c4a6e, #0369a1, #0ea5e9, #7dd3fc, #0ea5e9, #0369a1)',
    backgroundSize: '200% 200%',
    animation: 'diamondWave 3s ease infinite',
    color: '#e0f2fe',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  },
}
