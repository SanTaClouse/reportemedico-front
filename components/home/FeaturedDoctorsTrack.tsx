'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Monitor, ArrowRight } from 'lucide-react'
import { cldUrl } from '@/lib/cloudinary'
import PlanBadge, { planCardClass } from '@/components/guia/PlanBadge'
import VerifiedBadge from '@/components/guia/VerifiedBadge'
import type { PublicDoctorCard } from '@/lib/api-guia'

/** Velocidad del auto-scroll en px/segundo (independiente del refresh del monitor) */
const SPEED = 42
/** Copias de la lista: 3 garantiza que el loop no muestre huecos ni salte */
const COPIES = 3

/**
 * Vitrina de médicos que se desplaza sola en horizontal — la mejor UX que
 * pudimos hacer sin librería:
 *  - Se mueve sola (auto-scroll suave con rAF, no CSS, para poder combinarlo
 *    con el scroll nativo).
 *  - Se PUEDE arrastrar/deslizar: es un scroll nativo, así que en mobile se
 *    swipe-ea con inercia y en desktop con trackpad/rueda.
 *  - Se PAUSA al pasar el mouse, al tocar, al enfocar con teclado y cuando la
 *    pestaña no está visible → nadie persigue una card en movimiento para tocarla.
 *  - Loop infinito sin saltos (lista triplicada + wrap invisible).
 *  - Respeta prefers-reduced-motion: no se mueve sola, pero sigue siendo
 *    deslizable.
 *  - Accesible: las copias duplicadas son aria-hidden y no reciben foco.
 */
export default function FeaturedDoctorsTrack({ doctors }: { doctors: PublicDoctorCard[] }) {
  const scrollerRef = useRef<HTMLUListElement>(null)
  const pausedRef = useRef(false)
  const resumeUntilRef = useRef(0) // pausa momentánea (rueda) hasta este timestamp

  // Con muy pocos médicos no tiene sentido el loop; se muestra estático abajo.
  const enoughToLoop = doctors.length >= 3
  const list = enoughToLoop ? Array.from({ length: COPIES }).flatMap(() => doctors) : doctors

  useEffect(() => {
    const el = scrollerRef.current
    if (!el || !enoughToLoop) return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0
    let last = performance.now()

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05) // clamp: evita saltos si la pestaña estuvo dormida
      last = now
      const seg = el.scrollWidth / COPIES // ancho de UNA copia de la lista

      const paused = pausedRef.current || now < resumeUntilRef.current
      if (!paused && !media.matches && seg > 0) {
        el.scrollLeft += SPEED * dt
      }
      // Wrap invisible: al pasar una copia entera, retrocede una copia (idénticas)
      if (seg > 0) {
        while (el.scrollLeft >= seg) el.scrollLeft -= seg
      }
      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [enoughToLoop, doctors.length])

  // Handlers de pausa (hover / foco / puntero / rueda / visibilidad)
  const pause = () => { pausedRef.current = true }
  const resume = () => { pausedRef.current = false }
  const nudge = () => { resumeUntilRef.current = performance.now() + 1500 } // tras rueda/soltar, reanuda con retardo

  useEffect(() => {
    const onVisibility = () => { document.hidden ? pause() : resume() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  if (doctors.length === 0) return null

  const cards = list.map((doc, i) => {
    const isClone = i >= doctors.length
    const fullName = `${doc.title ?? ''} ${doc.firstName} ${doc.lastName}`.trim()
    const city = doc.clinics[0]?.city?.name
    return (
      <li key={`${doc.id}-${i}`} className="shrink-0 snap-start" aria-hidden={isClone || undefined}>
        <Link
          href={`/medico/${doc.slug}`}
          tabIndex={isClone ? -1 : undefined}
          className={`group flex flex-col w-[220px] sm:w-[240px] rounded-2xl overflow-hidden bg-[var(--color-surface)] hover:shadow-lg hover:-translate-y-0.5 transition-all ${planCardClass(doc.plan)}`}
        >
          {/* Foto (vertical) */}
          <div className="relative aspect-[4/5] bg-[var(--color-primary,#001450)]">
            {doc.photoUrl ? (
              <Image
                src={cldUrl(doc.photoUrl, { w: 480, h: 600 })}
                alt={`${fullName}, ${doc.specialties[0]?.name ?? 'médico'}`}
                fill
                className="object-cover"
                sizes="240px"
                draggable={false}
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center font-display text-4xl font-bold text-white/90">
                {doc.firstName[0]}{doc.lastName[0]}
              </span>
            )}
            <PlanBadge plan={doc.plan} className="absolute top-2 left-2 shadow-sm" />
          </div>

          {/* Datos */}
          <div className="p-3.5 flex flex-col gap-1 flex-1">
            <h3 className="font-display font-bold text-base text-[var(--color-text-primary)] leading-snug group-hover:text-[var(--color-primary)] transition-colors">
              {fullName}
              {doc.isVerified && <VerifiedBadge size={14} className="ml-1" />}
            </h3>
            <p className="text-sm font-medium text-[var(--color-primary)]">
              {doc.specialties[0]?.name ?? 'Médico'}
              {doc.specialties.length > 1 && (
                <span className="text-[var(--color-text-muted)] font-normal"> +{doc.specialties.length - 1}</span>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)]">
              {city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} /> {city}
                </span>
              )}
              {doc.telehealth && (
                <span className="inline-flex items-center gap-1 text-[var(--color-primary)]">
                  <Monitor size={12} /> Teleconsulta
                </span>
              )}
            </div>
            <span className="mt-auto pt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]">
              Ver perfil
              <ArrowRight size={14} strokeWidth={2.2} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>
      </li>
    )
  })

  // Sin suficientes médicos para el loop: fila estática centrada (sin auto-scroll)
  if (!enoughToLoop) {
    return (
      <ul className="flex gap-4 md:gap-5 flex-wrap">{cards}</ul>
    )
  }

  return (
    <div className="relative -mx-4 px-4 md:mx-0 md:px-0">
      {/* Difuminado en los bordes: las cards aparecen/desaparecen suave */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 md:w-16 bg-gradient-to-r from-[var(--color-surface)] to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 md:w-16 bg-gradient-to-l from-[var(--color-surface)] to-transparent" />

      <ul
        ref={scrollerRef}
        aria-label="Médicos destacados"
        className="flex gap-4 md:gap-5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-x-contain"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocusCapture={pause}
        onBlurCapture={resume}
        onPointerDown={pause}
        onPointerUp={() => { resume(); nudge() }}
        onPointerCancel={resume}
        onWheel={nudge}
        onTouchStart={pause}
        onTouchEnd={() => { resume(); nudge() }}
      >
        {cards}
      </ul>
    </div>
  )
}
