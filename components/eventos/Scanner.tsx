'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type QrScannerType from 'qr-scanner'
import {
  AlertTriangle, Camera, CameraOff, CheckCircle2, Flashlight, ImageUp, Loader2, LogOut, Radio, Search, Star, XCircle,
} from 'lucide-react'
import {
  SECTOR_LABELS, STATUS_LABELS, checkIn, currentPart, formatTime, partTitle, searchAccess,
  type CheckInResult, type EventPart, type PublicEvent, type ScanRegistration,
} from '@/lib/api-eventos'
import { feedback, unlockAudio } from './feedback'

interface Props {
  event: PublicEvent
  token: string
  userName: string | null
  isAdmin: boolean
}

type Shown =
  | { data: CheckInResult; input: { code?: string; registrationId?: string } }
  | { data: { result: 'ERROR'; message: string }; input: { code?: string; registrationId?: string } }

/** Un mismo QR leído dos veces seguidas (sigue frente a la cámara) no se vuelve a enviar */
const SAME_CODE_MS = 4000

export default function Scanner({ event, token, userName, isAdmin }: Props) {
  const [part, setPart] = useState<EventPart>(() => currentPart(event))
  const [tab, setTab] = useState<'scan' | 'search'>('scan')
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [hasFlash, setHasFlash] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const [shown, setShown] = useState<Shown | null>(null)
  const [busy, setBusy] = useState(false)
  const [count, setCount] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScannerType | null>(null)
  const lastCode = useRef<{ code: string; at: number } | null>(null)
  // Refs para que el callback de la cámara lea siempre el estado actual
  const partRef = useRef(part)
  const busyRef = useRef(false)
  const shownRef = useRef<Shown | null>(null)
  partRef.current = part
  busyRef.current = busy
  shownRef.current = shown

  const process = useCallback(
    async (input: { code?: string; registrationId?: string }, force = false) => {
      setBusy(true)
      busyRef.current = true
      try {
        const data = await checkIn(event.slug, { ...input, part: partRef.current, force }, token)
        setShown({ data, input })
        if (data.result === 'OK') {
          setCount((c) => c + 1)
          feedback(data.registration.isVip ? 'vip' : 'ok')
        } else if (data.result === 'ALREADY' || data.result === 'WRONG_PART') {
          feedback('warn')
        } else {
          feedback('error')
        }
      } catch (e) {
        setShown({ data: { result: 'ERROR', message: (e as Error).message }, input })
        feedback('error')
      } finally {
        setBusy(false)
        busyRef.current = false
      }
    },
    [event.slug, token],
  )

  const onDecode = useCallback(
    (code: string) => {
      if (busyRef.current || shownRef.current) return
      const now = Date.now()
      if (lastCode.current && lastCode.current.code === code && now - lastCode.current.at < SAME_CODE_MS) return
      lastCode.current = { code, at: now }
      void process({ code })
    },
    [process],
  )

  // Cámara: se crea al activarla y se destruye al salir de la pestaña
  useEffect(() => {
    if (!cameraOn || tab !== 'scan') return
    let cancelled = false
    let scanner: QrScannerType | null = null
    ;(async () => {
      const { default: QrScanner } = await import('qr-scanner')
      if (cancelled || !videoRef.current) return
      scanner = new QrScanner(videoRef.current, (r) => onDecode(r.data), {
        preferredCamera: 'environment',
        maxScansPerSecond: 8,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
      })
      scannerRef.current = scanner
      try {
        await scanner.start()
        setCameraError('')
        setHasFlash(await scanner.hasFlash())
      } catch (e) {
        const msg = String((e as Error)?.message ?? e)
        setCameraError(
          /permission|denied|NotAllowed/i.test(msg)
            ? 'El navegador no dio permiso para usar la cámara. Actívalo en los ajustes del sitio o usa la búsqueda por nombre.'
            : 'No se pudo abrir la cámara. Prueba recargar la página o usa la búsqueda por nombre.',
        )
      }
    })()
    return () => {
      cancelled = true
      scanner?.destroy()
      scannerRef.current = null
      setFlashOn(false)
    }
  }, [cameraOn, tab, onDecode])

  // Resultado: el verde se cierra solo rápido para no frenar la fila
  useEffect(() => {
    if (!shown) return
    const ms = shown.data.result === 'OK' ? 2200 : 7000
    const id = setTimeout(() => setShown(null), ms)
    return () => clearTimeout(id)
  }, [shown])

  const toggleFlash = async () => {
    const s = scannerRef.current
    if (!s) return
    await s.toggleFlash()
    setFlashOn(s.isFlashOn())
  }

  const scanFile = async (file: File) => {
    unlockAudio()
    try {
      const { default: QrScanner } = await import('qr-scanner')
      const r = await QrScanner.scanImage(file, { returnDetailedScanResult: true })
      lastCode.current = null
      void process({ code: r.data })
    } catch {
      setShown({ data: { result: 'NOT_FOUND' }, input: {} })
      feedback('error')
    }
  }

  const logout = async () => {
    await fetch('/api/auth/set-cookie', { method: 'DELETE' })
    window.location.href = '/admin/login'
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col">
      {/* Encabezado */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-cyan">Control de acceso</p>
            <p className="font-display text-lg font-bold leading-tight">{event.name}</p>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-white/60 hover:bg-white/10">
            <LogOut size={14} strokeWidth={1.5} /> {userName ?? 'Salir'}
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1" role="radiogroup" aria-label="Parte del evento">
          {(['DAY', 'EVENING'] as EventPart[]).map((p) => (
            <button
              key={p}
              role="radio"
              aria-checked={part === p}
              onClick={() => setPart(p)}
              className={`rounded-lg px-2 py-2 text-sm font-semibold transition ${
                part === p ? 'bg-brand-gold text-brand-navy' : 'text-white/70 hover:bg-white/10'
              }`}
            >
              {partTitle(event, p)}
            </button>
          ))}
        </div>
      </header>

      {/* Pestañas */}
      <div className="grid grid-cols-2 border-b border-white/10 text-sm font-semibold">
        {([
          { key: 'scan', label: 'Escanear QR', icon: Camera },
          { key: 'search', label: 'Buscar por nombre', icon: Search },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center justify-center gap-2 py-3 ${
              tab === key ? 'border-b-2 border-brand-cyan text-white' : 'text-white/50'
            }`}
          >
            <Icon size={16} strokeWidth={1.5} /> {label}
          </button>
        ))}
      </div>

      <main className="flex-1 px-4 py-5">
        {tab === 'scan' ? (
          <div>
            {cameraOn ? (
              <>
                <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-2xl bg-black">
                  <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
                  {busy && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 size={40} className="animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  {hasFlash && (
                    <button
                      onClick={toggleFlash}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold ${
                        flashOn ? 'bg-brand-gold text-brand-navy' : 'bg-white/10'
                      }`}
                    >
                      <Flashlight size={16} strokeWidth={1.5} /> Linterna
                    </button>
                  )}
                  <button
                    onClick={() => setCameraOn(false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-sm font-semibold"
                  >
                    <CameraOff size={16} strokeWidth={1.5} /> Apagar cámara
                  </button>
                </div>
                <p className="mt-3 text-center text-sm text-white/50">Apunta al código QR del invitado.</p>
              </>
            ) : (
              <button
                onClick={() => {
                  unlockAudio()
                  setCameraOn(true)
                }}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/20 py-16 text-lg font-bold hover:border-brand-cyan"
              >
                <Camera size={44} strokeWidth={1.5} className="text-brand-cyan" />
                Activar cámara
              </button>
            )}

            {cameraError && (
              <p className="mt-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{cameraError}</p>
            )}

            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 py-3 text-sm text-white/70 hover:bg-white/5">
              <ImageUp size={16} strokeWidth={1.5} /> Escanear desde una imagen
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void scanFile(f)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
        ) : (
          <ManualSearch event={event} token={token} part={part} busy={busy} onCheckIn={(id) => process({ registrationId: id })} />
        )}
      </main>

      <footer className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-sm text-white/60">
        <span>
          Ingresos en este dispositivo: <strong className="text-white">{count}</strong>
        </span>
        <Link href={`/acceso/${event.slug}/en-vivo`} className="flex items-center gap-1.5 text-brand-cyan">
          <Radio size={14} strokeWidth={1.5} /> En vivo
        </Link>
      </footer>
      {isAdmin && (
        <p className="pb-3 text-center text-[11px] text-white/40">
          <Link href="/admin/eventos" className="underline">Volver al panel</Link>
        </p>
      )}

      {shown && (
        <ResultOverlay
          shown={shown}
          event={event}
          part={part}
          onClose={() => setShown(null)}
          onForce={() => {
            const input = shown.input
            setShown(null)
            void process(input, true)
          }}
        />
      )}
    </div>
  )
}

// ─── Resultado a pantalla completa ──────────────────────────────────────────

function ResultOverlay({
  shown, event, part, onClose, onForce,
}: {
  shown: Shown
  event: PublicEvent
  part: EventPart
  onClose: () => void
  onForce: () => void
}) {
  const d = shown.data
  const reg = 'registration' in d ? d.registration : null

  const look =
    d.result === 'OK'
      ? { bg: 'bg-emerald-600', icon: CheckCircle2, title: 'forced' in d && d.forced ? 'Ingreso registrado' : 'Bienvenido/a' }
      : d.result === 'ALREADY'
        ? { bg: 'bg-amber-500', icon: AlertTriangle, title: 'Ya ingresó' }
        : d.result === 'WRONG_PART'
          ? { bg: 'bg-amber-500', icon: AlertTriangle, title: `No está inscrito a ${partTitle(event, part)}` }
          : d.result === 'NOT_APPROVED'
            ? { bg: 'bg-red-600', icon: XCircle, title: 'Inscripción no aprobada' }
            : d.result === 'ERROR'
              ? { bg: 'bg-red-600', icon: XCircle, title: 'Sin conexión con el servidor' }
              : { bg: 'bg-red-600', icon: XCircle, title: 'Código no válido' }
  const Icon = look.icon

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center text-white ${look.bg}`}
      onClick={onClose}
      role="alertdialog"
      aria-live="assertive"
    >
      <Icon size={88} strokeWidth={1.5} />
      <p className="mt-4 font-display text-3xl font-bold">{look.title}</p>

      {reg && (
        <div className="mt-4">
          <p className="text-2xl font-bold leading-tight">
            {reg.firstName} {reg.lastName}
          </p>
          <p className="mt-1 text-white/85">
            {[reg.institution, reg.position].filter(Boolean).join(' · ') || SECTOR_LABELS[reg.sector]}
          </p>
          {reg.isVip && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-gold px-4 py-1.5 text-sm font-bold text-brand-navy">
              <Star size={16} strokeWidth={2} fill="currentColor" /> Invitado VIP
            </p>
          )}
          {reg.isTest && <p className="mt-2 text-xs font-bold uppercase tracking-widest text-white/70">Prueba</p>}
        </div>
      )}

      {d.result === 'ALREADY' && (
        <p className="mt-4 text-lg">
          Entró a las {formatTime(d.checkedInAt)}
          {d.by ? ` (lo registró ${d.by})` : ''}
        </p>
      )}
      {d.result === 'NOT_APPROVED' && reg && (
        <p className="mt-4 text-lg">Estado: {STATUS_LABELS[reg.status]}. Consulta con el equipo del evento.</p>
      )}
      {d.result === 'NOT_FOUND' && (
        <p className="mt-4 text-lg">El código no corresponde a ninguna inscripción. Prueba buscar por nombre.</p>
      )}
      {d.result === 'ERROR' && <p className="mt-4 text-lg">Revisa la conexión y vuelve a intentar.</p>}

      {d.result === 'WRONG_PART' ? (
        <div className="mt-8 flex w-full max-w-xs flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          <button onClick={onForce} className="rounded-xl bg-white py-3.5 font-bold text-amber-700">
            Dejar pasar igual
          </button>
          <button onClick={onClose} className="rounded-xl bg-black/20 py-3.5 font-semibold">
            Cancelar
          </button>
        </div>
      ) : (
        <p className="mt-10 text-sm text-white/70">Toca para continuar</p>
      )}
    </div>
  )
}

// ─── Búsqueda manual ────────────────────────────────────────────────────────

function ManualSearch({
  event, token, part, busy, onCheckIn,
}: {
  event: PublicEvent
  token: string
  part: EventPart
  busy: boolean
  onCheckIn: (registrationId: string) => void
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<ScanRegistration[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const id = setTimeout(() => {
      searchAccess(event.slug, term, token)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(id)
  }, [q, event.slug, token, busy]) // `busy` vuelve a buscar tras registrar un ingreso

  return (
    <div>
      <div className="relative">
        <Search size={18} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nombre, apellido, email o teléfono"
          className="w-full rounded-xl border border-white/15 bg-white/5 py-3.5 pl-10 pr-3 text-base text-white placeholder:text-white/40 focus:border-brand-cyan focus:outline-none"
        />
      </div>

      {loading && <p className="mt-4 text-center text-sm text-white/50">Buscando…</p>}
      {!loading && q.trim().length >= 2 && results.length === 0 && (
        <p className="mt-4 text-center text-sm text-white/50">No hay inscritos con ese dato.</p>
      )}

      <ul className="mt-4 space-y-2">
        {results.map((r) => {
          const inside = r.checkIns.find((c) => c.part === part)
          const approved = r.status === 'APPROVED'
          return (
            <li key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {r.isVip && <Star size={14} className="mr-1 inline text-brand-gold" fill="currentColor" />}
                    {r.firstName} {r.lastName}
                  </p>
                  <p className="text-xs text-white/60">{r.institution || SECTOR_LABELS[r.sector]}</p>
                  <p className={`mt-1 text-xs font-semibold ${approved ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {STATUS_LABELS[r.status]}
                    {inside && ` · entró a las ${formatTime(inside.createdAt)}`}
                    {r.isTest && ' · prueba'}
                  </p>
                </div>
                {approved && !inside && (
                  <button
                    disabled={busy}
                    onClick={() => onCheckIn(r.id)}
                    className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold disabled:opacity-50"
                  >
                    Registrar ingreso
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
