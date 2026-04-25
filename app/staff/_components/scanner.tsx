'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { CheckCircle, XCircle, ScanLine, RefreshCw, CameraOff, Camera } from 'lucide-react'
import { validateTicket, type ValidationResult } from '../actions'

type ScanState = 'idle' | 'scanning' | 'loading' | 'result'
type QrScannerLike = {
  pause: () => void
  start: () => Promise<void>
  destroy: () => void
}

export default function Scanner() {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const scannerRef  = useRef<QrScannerLike | null>(null)
  const lastHashRef = useRef('')
  const stateRef    = useRef<ScanState>('idle')

  const [state, setStateRaw]    = useState<ScanState>('idle')
  const [result, setResult]     = useState<ValidationResult | null>(null)
  const [camError, setCamError] = useState<string | null>(null)

  const setState = useCallback((s: ScanState) => {
    stateRef.current = s
    setStateRaw(s)
  }, [])

  const handleScan = useCallback(async (hash: string) => {
    if (hash === lastHashRef.current || stateRef.current !== 'scanning') return
    lastHashRef.current = hash

    setState('loading')
    scannerRef.current?.pause()

    const res = await validateTicket(hash)
    setResult(res)
    setState('result')

    if (typeof window !== 'undefined') {
      const { Capacitor } = await import('@capacitor/core')
      if (Capacitor.isNativePlatform()) {
        const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics')
        if (res.success) {
          await Haptics.impact({ style: ImpactStyle.Medium })
        } else {
          await Haptics.notification({ type: NotificationType.Error })
        }
      }
    }
  }, [setState])

  const reset = useCallback(() => {
    setResult(null)
    lastHashRef.current = ''
    setState('scanning')
    scannerRef.current?.start()
  }, [setState])

  // Inicializa y arranca la cámara — solo cuando el usuario pulsa el botón
  const startCamera = useCallback(async () => {
    if (!videoRef.current) return
    setCamError(null)

    // Pide permiso explícito antes de crear el scanner (necesario en iOS Safari)
    try {
      await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    } catch {
      setCamError('No se pudo acceder a la cámara. Verifica los permisos del navegador.')
      return
    }

    const { default: QrScanner } = await import('qr-scanner')
    if (!videoRef.current) return

    QrScanner.WORKER_PATH = '/qr-scanner-worker.min.js'

    const scanner = new QrScanner(
      videoRef.current,
      (r) => handleScan(r.data),
      {
        preferredCamera:          'environment',
        highlightScanRegion:      true,
        highlightCodeOutline:     true,
        returnDetailedScanResult: true,
      }
    )

    scannerRef.current = scanner
    scanner.start().catch(() => {
      setCamError('No se pudo acceder a la cámara. Verifica los permisos del navegador.')
    })
    setState('scanning')
  }, [handleScan, setState])

  // Limpia al desmontar
  useEffect(() => {
    return () => { scannerRef.current?.destroy() }
  }, [])

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center bg-zinc-950">

      {/* Pantalla inicial — requiere gesto del usuario para iOS */}
      {state === 'idle' && !camError && (
        <div className="flex flex-col items-center gap-6 p-8 text-center">
          <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center">
            <Camera size={40} className="text-zinc-400" />
          </div>
          <div className="space-y-1">
            <p className="text-white font-semibold text-lg">Escanear boleto o extra</p>
            <p className="text-zinc-500 text-sm">Se necesita acceso a la cámara</p>
          </div>
          <button
            type="button"
            onClick={startCamera}
            className="px-8 py-3 bg-white text-zinc-900 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
          >
            Activar cámara
          </button>
        </div>
      )}

      {state === 'idle' && camError && (
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <CameraOff size={36} className="text-zinc-500" />
          <p className="text-sm text-zinc-400">{camError}</p>
          <button
            type="button"
            onClick={startCamera}
            className="px-6 py-2.5 bg-white text-zinc-900 rounded-xl font-semibold text-sm"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className={`relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 ${state === 'idle' ? 'hidden' : ''}`}>
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

        {/* Visor de escaneo */}
        {state === 'scanning' && !camError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-52 h-52">
              <span className="absolute top-0    left-0  w-8 h-8 border-t-[3px] border-l-[3px] border-white rounded-tl-lg" />
              <span className="absolute top-0    right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-white rounded-tr-lg" />
              <span className="absolute bottom-0 left-0  w-8 h-8 border-b-[3px] border-l-[3px] border-white rounded-bl-lg" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-white rounded-br-lg" />
              <ScanLine size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/40 animate-pulse" />
            </div>
          </div>
        )}

        {/* Cargando */}
        {state === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Resultado */}
        {state === 'result' && result && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 ${
            result.success ? 'bg-green-600/95' : 'bg-red-600/95'
          }`}>
            {result.success
              ? <CheckCircle size={64} strokeWidth={1.5} className="text-white" />
              : <XCircle    size={64} strokeWidth={1.5} className="text-white" />
            }
            <p className="text-3xl font-bold text-white">
              {result.success ? '¡VÁLIDO!' : 'INVÁLIDO'}
            </p>
            <p className="text-white/80 text-sm">{result.message}</p>

            {result.success && result.kind === 'ticket' && (
              <div className="w-full bg-white/15 rounded-xl p-4 text-sm space-y-2 text-white">
                <p><span className="text-white/60">Evento</span><br />{result.ticket.eventTitle}</p>
                <p><span className="text-white/60">Tier</span><br />{result.ticket.tierName}</p>
                <p><span className="text-white/60">Titular</span><br />{result.ticket.ownerName}</p>
                {result.ticket.items.length > 0 && (
                  <div className="pt-1 border-t border-white/20">
                    <p className="text-white/60 mb-1">Incluye</p>
                    <ul className="space-y-0.5">
                      {result.ticket.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-1.5 font-medium">
                          <span className="text-white/60">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {result.success && result.kind === 'perk' && (
              <div className="w-full bg-white/15 rounded-xl p-4 text-sm space-y-2 text-white">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Extra canjeado</p>
                <p className="text-xl font-bold">{result.perk.perkName}</p>
                <p><span className="text-white/60">Evento</span><br />{result.perk.eventTitle}</p>
                <p><span className="text-white/60">Titular</span><br />{result.perk.ownerName}</p>
              </div>
            )}

            <button
              onClick={reset}
              className="mt-2 flex items-center gap-2 bg-white text-zinc-900 px-6 py-2.5 rounded-xl text-sm font-semibold"
            >
              <RefreshCw size={15} />
              Escanear otro
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-sm text-zinc-500 text-center px-4">
        {state === 'scanning' && 'Apunta la cámara al QR del boleto o extra'}
        {state === 'loading'  && 'Validando...'}
      </p>
    </div>
  )
}
