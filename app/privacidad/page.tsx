export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#140a2a] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h1 className="text-white text-lg font-semibold">Aviso de Privacidad</h1>
        <a
          href="/archivos/aviso.pdf"
          download
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          Descargar PDF
        </a>
      </div>
      <iframe
        src="/archivos/aviso.pdf"
        className="flex-1 w-full"
        style={{ minHeight: 'calc(100vh - 64px)' }}
        title="Aviso de Privacidad"
      />
    </div>
  )
}
