import Scanner from './_components/scanner'

export default function StaffPage() {
  return (
    <div className="flex-1 flex flex-col px-4 py-6 gap-4" style={{ background: 'var(--background)' }}>
      <div className="text-center">
        <h1 className="text-lg font-semibold text-white">Validación de boletos</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Escanea el QR del boleto para validar la entrada
        </p>
      </div>
      <Scanner />
    </div>
  )
}
