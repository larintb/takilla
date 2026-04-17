import EventsNavbar from './_components/events-navbar'

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <EventsNavbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  )
}