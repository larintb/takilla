const S = {
  bar:    { background: 'rgba(255,255,255,0.06)', borderRadius: 6 },
  card:   { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 },
  circle: { background: 'rgba(255,255,255,0.06)', borderRadius: '50%' },
}

function Pulse({ w, h, style = {} }: { w: string | number; h: number; style?: React.CSSProperties }) {
  return (
    <div
      className="animate-pulse"
      style={{ width: w, height: h, flexShrink: 0, ...S.bar, ...style }}
    />
  )
}

export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 pb-16">
      {/* Header */}
      <div className="space-y-2">
        <Pulse w={240} h={28} />
        <Pulse w={300} h={14} />
      </div>

      {/* Metrics grid */}
      <div className="space-y-3">
        <Pulse w={120} h={11} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl p-5 space-y-3" style={S.card}>
              <div className="flex justify-between">
                <Pulse w={80} h={11} />
                <Pulse w={16} h={16} />
              </div>
              <Pulse w="60%" h={40} />
              <Pulse w="80%" h={11} />
            </div>
          ))}
        </div>
      </div>

      {/* Events table */}
      <div className="space-y-3">
        <Pulse w={160} h={11} />
        <div className="animate-pulse rounded-2xl overflow-hidden" style={S.card}>
          {/* Header row */}
          <div className="px-4 py-3 flex gap-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {[160, 100, 80, 60, 110, 90, 80].map((w, i) => (
              <Pulse key={i} w={w} h={10} />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-4" style={{ borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ ...S.bar, width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
              <Pulse w={140} h={13} />
              <Pulse w={90} h={12} />
              <Pulse w={70} h={12} />
              <Pulse w={48} h={12} />
              <div className="flex flex-col gap-1" style={{ width: 100 }}>
                <Pulse w={60} h={10} />
                <Pulse w="100%" h={6} />
              </div>
              <Pulse w={80} h={12} />
              <Pulse w={70} h={22} style={{ borderRadius: 9999 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Activity feed */}
      <div className="space-y-3">
        <Pulse w={130} h={11} />
        <div className="animate-pulse rounded-2xl overflow-hidden" style={S.card}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ ...S.circle, width: 36, height: 36, flexShrink: 0 }} />
              <div className="flex-1 space-y-1.5">
                <Pulse w="55%" h={13} />
                <Pulse w="30%" h={10} />
              </div>
              <Pulse w={60} h={13} />
            </div>
          ))}
        </div>
      </div>

      {/* Applications */}
      <div className="space-y-3">
        <Pulse w={180} h={11} />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl p-4 space-y-2" style={S.card}>
              <Pulse w={70} h={10} />
              <Pulse w={40} h={30} />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl px-5 py-4 flex items-center justify-between gap-4" style={S.card}>
              <div className="space-y-1.5 flex-1">
                <Pulse w={150} h={14} />
                <Pulse w={200} h={11} />
                <Pulse w={100} h={10} />
              </div>
              <div className="flex gap-2">
                <Pulse w={80} h={32} style={{ borderRadius: 8 }} />
                <Pulse w={80} h={32} style={{ borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
