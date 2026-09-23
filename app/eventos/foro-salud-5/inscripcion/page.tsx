import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react'
import RegistrationForm from '@/components/eventos/RegistrationForm'
import { formatDate, getEvent } from '@/lib/api-eventos'
import { getSpecialties } from '@/lib/api-guia'
import { EVENT_SLUG, FALLBACK_EVENT, OG_IMAGE } from '../content'

export const dynamic = 'force-dynamic'

const TITLE = 'Inscríbete al Foro de Salud Reporte Médico 5.0'
const DESCRIPTION =
  'Evento gratuito con cupos limitados: 26 de noviembre de 2026 en el Hotel Jaragua, Santo Domingo. 9 paneles con los líderes del sector salud y la gala "50 Líderes que Transforman la Salud en RD".'

// El openGraph va completo (imagen incluida) porque si no se hereda el del
// layout y al compartir el link del formulario aparece el título del sitio.
export const metadata: Metadata = {
  title: 'Inscripción — Foro de Salud Reporte Médico 5.0',
  description: DESCRIPTION,
  alternates: { canonical: `/eventos/${EVENT_SLUG}/inscripcion` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `/eventos/${EVENT_SLUG}/inscripcion`,
    type: 'website',
    images: [OG_IMAGE],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [OG_IMAGE.url] },
}

export default async function InscripcionPage() {
  const [event, specialties] = await Promise.all([
    getEvent(EVENT_SLUG).catch(() => FALLBACK_EVENT),
    getSpecialties().catch(() => []),
  ])

  return (
    <div className="min-h-screen bg-[var(--color-surface-2)]">
      <header className="bg-brand-navy text-white">
        <div className="max-w-xl mx-auto px-4 pt-5 pb-7">
          <Link
            href={`/eventos/${EVENT_SLUG}`}
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
          >
            <ArrowLeft size={16} strokeWidth={1.5} /> Ver el evento
          </Link>
          <h1 className="mt-3 font-display font-bold text-2xl sm:text-3xl leading-tight">
            Inscríbete al Foro de Salud <span className="text-brand-cyan">5.0</span>
          </h1>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/80">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={15} strokeWidth={1.5} className="text-brand-gold" />
              {formatDate(event.dayStartsAt, { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} strokeWidth={1.5} className="text-brand-gold" /> Hotel Jaragua, Santo Domingo
            </span>
          </p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 -mt-3 pb-12">
        <div className="relative rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm p-5 sm:p-7">
          {event.registrationOpen ? (
            <RegistrationForm event={event} specialties={specialties.map((s) => ({ id: s.id, name: s.name }))} />
          ) : (
            <div className="text-center py-6">
              <h2 className="font-display font-bold text-2xl text-[var(--color-text-primary)]">Inscripciones cerradas</h2>
              <p className="mt-2 text-[var(--color-text-secondary)]">
                Ya no estamos recibiendo inscripciones para este evento. Gracias por tu interés.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
