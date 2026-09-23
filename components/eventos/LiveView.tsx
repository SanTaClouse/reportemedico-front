'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, BellOff, Star, Wifi, WifiOff } from 'lucide-react'
import { SECTOR_LABELS, formatTime, getLive, partTitle, type LiveData } from '@/lib/api-eventos'
import { feedback, unlockAudio } from './feedback'

const POLL_MS = 5000

/**
 * Vista en vivo del día del evento (pedido de Alberto): cuántos entraron de
 * cada parte y quiénes. Solo avisa —resaltado + sonido— cuando entra alguien
 * marcado como VIP, para que no moleste con cientos de ingresos.
 */
export default function LiveView({ slug, token }: { slug: string; token: string }) {
  const [data, setData] = useState<LiveData | null>(null)
  const [online, setOnline] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [sound, setSound] = useState(false)
  const [onlyVip, setOnlyVip] = useState(false)
  const [vipAlert, setVipAlert] = useState<LiveData['latest'][number] | null>(null)
  const seen = useRef<Set<string> | null>(null)
  const soundRef = useRef(sound)
  soundRef.current = sound

  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const d = await getLive(slug, token)
        if (!alive) return
        // Primera carga: se marcan como vistos sin avisar
        if (seen.current) {
          const newVip = d.latest.find((c) => c.registration.isVip && !seen.current!.has(c.id))
          if (newVip) {
            setVipAlert(newVip)
            if (soundRef.current) feedback('vip')
          }
        }
        seen.current = new Set(d.latest.map((c) => c.id))
        setData(d)
        setOnline(true)
        setUpdatedAt(new Date())
      } catch {
        if (alive) setOnline(false)
      }
    }
    void tick()
    const id = setInterval(tick, POLL_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [slug, token])

  useEffect(() => {
    if (!vipAlert) return
    const id = setTimeout(() => setVipAlert(null), 15000)
    return () => clearTimeout(id)
  }, [vipAlert])

  if (!data) {
    return <p className="p-10 text-center text-white/60">{online ? 'Cargando…' : 'Sin conexión con el servidor'}</p>
  }

  const s = data.stats
  const counters = [
    { title: data.event.dayTitle, inside: s.checkedInDay, expected: s.approvedDay },
    { title: data.event.eveningTitle, inside: s.checkedInEvening, expected: s.approvedEvening },
  ]
  const list = onlyVip ? data.latest.filter((c) => c.registration.isVip) : data.latest

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/acceso/${slug}`} className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
          <ArrowLeft size={16} strokeWidth={1.5} /> Escáner
        </Link>
        <span className={`flex items-center gap-1.5 text-xs ${online ? 'text-emerald-400' : 'text-red-400'}`}>
          {online ? <Wifi size={14} strokeWidth={1.5} /> : <WifiOff size={14} strokeWidth={1.5} />}
          {online ? `En vivo · ${updatedAt ? formatTime(updatedAt.toISOString()) : ''}` : 'Sin conexión, reintentando…'}
        </span>
      </div>

      <h1 className="mt-3 font-display text-2xl font-bold">{data.event.name}</h1>

      {vipAlert && (
        <button
          onClick={() => setVipAlert(null)}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-brand-gold px-4 py-4 text-left text-brand-navy shadow-lg animate-pulse"
        >
          <Star size={28} strokeWidth={2} fill="currentColor" className="shrink-0" />
          <span>
            <span className="block text-xs font-bold uppercase tracking-widest">Llegó un invitado VIP</span>
            <span className="block text-lg font-bold">
              {vipAlert.registration.firstName} {vipAlert.registration.lastName}
            </span>
            <span className="block text-sm">
              {vipAlert.registration.institution ?? SECTOR_LABELS[vipAlert.registration.sector]} ·{' '}
              {formatTime(vipAlert.createdAt)}
            </span>
          </span>
        </button>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        {counters.map((c) => {
          const pct = c.expected ? Math.min(100, Math.round((c.inside / c.expected) * 100)) : 0
          return (
            <div key={c.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-widest text-white/60">{c.title}</p>
              <p className="mt-2 font-display text-5xl font-bold tabular-nums">{c.inside}</p>
              <p className="text-sm text-white/60">de {c.expected} aprobados</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-brand-cyan transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-2">
        <h2 className="font-semibold">Últimos ingresos</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setOnlyVip((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              onlyVip ? 'bg-brand-gold text-brand-navy' : 'bg-white/10 text-white/80'
            }`}
          >
            <Star size={13} strokeWidth={2} /> Solo VIP
          </button>
          <button
            onClick={() => {
              unlockAudio()
              setSound((v) => !v)
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              sound ? 'bg-brand-cyan text-brand-navy' : 'bg-white/10 text-white/80'
            }`}
            title="Sonido cuando entra un VIP"
          >
            {sound ? <Bell size={13} strokeWidth={2} /> : <BellOff size={13} strokeWidth={2} />}
            {sound ? 'Sonido VIP' : 'Sin sonido'}
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="mt-6 text-center text-sm text-white/50">Todavía no hay ingresos registrados.</p>
      ) : (
        <ul className="mt-3 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03]">
          {list.map((c) => (
            <li key={c.id} className={`flex items-center gap-3 px-4 py-3 ${c.registration.isVip ? 'bg-brand-gold/10' : ''}`}>
              <span className="w-16 shrink-0 text-sm tabular-nums text-white/60">{formatTime(c.createdAt)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {c.registration.isVip && <Star size={13} className="mr-1 inline text-brand-gold" fill="currentColor" />}
                  {c.registration.firstName} {c.registration.lastName}
                  {c.registration.isTest && <span className="ml-2 text-[10px] font-bold uppercase text-amber-400">prueba</span>}
                </span>
                <span className="block truncate text-xs text-white/50">
                  {c.registration.institution ?? SECTOR_LABELS[c.registration.sector]}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-white/70">
                {partTitle(data.event, c.part).split(' ')[0]}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-center text-[11px] text-white/40">Se actualiza cada {POLL_MS / 1000} segundos. Los contadores no incluyen pruebas.</p>
    </div>
  )
}
