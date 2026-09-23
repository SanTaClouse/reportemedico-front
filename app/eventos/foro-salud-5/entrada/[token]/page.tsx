import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { Clock, MapPin, SunMedium } from 'lucide-react'
import { formatDate, formatTime, getEntry, partTitle, partWindow, partsOf } from '@/lib/api-eventos'
import { EVENT_SLUG } from '../../content'

export const dynamic = 'force-dynamic'

// Pase personal: nunca indexar
export const metadata: Metadata = {
  title: 'Mi entrada — Foro de Salud Reporte Médico 5.0',
  robots: { index: false, follow: false },
}

export default async function EntradaPage({ params }: { params: { token: string } }) {
  const entry = await getEntry(EVENT_SLUG, params.token).catch(() => null)
  if (!entry) notFound()

  const { event, registration: r } = entry
  const svg = await QRCode.toString(entry.qrValue, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' })

  return (
    <div className="min-h-screen bg-brand-navy px-4 py-8 text-white">
      <div className="mx-auto max-w-sm">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.3em] text-brand-cyan">Tu entrada</p>
        <h1 className="mt-1 text-center font-display text-2xl font-bold">
          Foro de Salud Reporte Médico <span className="text-brand-cyan">5.0</span>
        </h1>

        {r.isTest && (
          <p className="mt-4 rounded-lg bg-amber-400 px-3 py-1.5 text-center text-xs font-bold uppercase tracking-wide text-amber-950">
            Entrada de prueba
          </p>
        )}

        <div className="mt-6 rounded-3xl bg-white p-5 text-brand-navy shadow-2xl">
          {/* El SVG lo genera el server con el valor que codifica el back */}
          <div
            className="mx-auto aspect-square w-full max-w-[300px] [&>svg]:h-full [&>svg]:w-full"
            role="img"
            aria-label="Código QR de acceso"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <p className="mt-4 text-center font-display text-2xl font-bold leading-tight">
            {r.firstName} {r.lastName}
          </p>
          {r.institution && <p className="text-center text-sm text-slate-500">{r.institution}</p>}

          <ul className="mt-5 space-y-3 border-t border-slate-200 pt-4">
            {partsOf(r.attendance).map((part) => {
              const w = partWindow(event, part)
              return (
                <li key={part}>
                  <p className="font-bold">{partTitle(event, part)}</p>
                  <p className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Clock size={14} strokeWidth={1.5} />
                    {formatDate(w.start, { day: 'numeric', month: 'long' })} · {formatTime(w.start)} – {formatTime(w.end)}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-slate-600">
                    <MapPin size={14} strokeWidth={1.5} /> {w.where}
                  </p>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="mt-6 space-y-2 text-sm text-white/75">
          <p className="flex items-start gap-2">
            <SunMedium size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-brand-gold" />
            En la entrada, sube el brillo de la pantalla para que el código se lea al instante.
          </p>
          <p>Te recomendamos guardar una captura de pantalla por si no tienes señal en el lugar. Este código es personal.</p>
        </div>

        <p className="mt-8 text-center">
          <Link href={`/eventos/${EVENT_SLUG}`} className="text-sm text-white/60 underline hover:text-white">
            Ver el programa del evento
          </Link>
        </p>
      </div>
    </div>
  )
}
