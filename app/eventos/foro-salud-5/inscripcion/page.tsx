import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react'
import RegistrationForm from '@/components/eventos/RegistrationForm'
import { formatDate, getEvent } from '@/lib/api-eventos'
import { getSpecialties } from '@/lib/api-guia'
import { EVENT_SLUG, FALLBACK_EVENT } from '../content'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Inscripción — Foro de Salud Reporte Médico 5.0',
  description: 'Inscríbete gratis al Foro de Salud Reporte Médico 5.0: 26 de noviembre de 2026, Hotel Jaragua, Santo Domingo.',
  alternates: { canonical: `/eventos/${EVENT_SLUG}/inscripcion` },
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
