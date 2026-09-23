import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, ChevronDown, Clock, MapPin, Navigation, Sparkles, Ticket } from 'lucide-react'
import Countdown from '@/components/eventos/Countdown'
import { formatDate, formatTime, getEvent, SITE_URL, type PublicEvent } from '@/lib/api-eventos'
import { ACCESS_STEPS, AXES, EVENT_SLUG, FALLBACK_EVENT, INTRO, LEADERS } from './content'

export const revalidate = 60

const TITLE = 'Foro de Salud Reporte Médico 5.0'
const DESCRIPTION =
  'Innovar · Conectar · Avanzar. 26 de noviembre de 2026 en el Hotel Jaragua: 9 paneles con los líderes del sector salud y la gala "50 Líderes que Transforman la Salud en RD". Evento gratuito con inscripción.'

export const metadata: Metadata = {
  title: `${TITLE} — 26 de noviembre`,
  description: DESCRIPTION,
  alternates: { canonical: `/eventos/${EVENT_SLUG}` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `/eventos/${EVENT_SLUG}`,
    images: [{ url: '/eventos/foro-salud-5/flyer-foro.png', width: 1081, height: 1351, alt: 'Foro de Salud Reporte Médico 5.0' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

async function loadEvent(): Promise<PublicEvent> {
  return getEvent(EVENT_SLUG).catch(() => FALLBACK_EVENT)
}

function eventJsonLd(e: PublicEvent) {
  const place = {
    '@type': 'Place',
    name: e.venueName,
    address: { '@type': 'PostalAddress', streetAddress: e.venueAddress, addressLocality: 'Santo Domingo', addressCountry: 'DO' },
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.name,
    description: DESCRIPTION,
    startDate: e.dayStartsAt,
    endDate: e.eveningEndsAt,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    isAccessibleForFree: true,
    location: place,
    image: [`${SITE_URL}/eventos/foro-salud-5/flyer-foro.png`],
    organizer: { '@type': 'Organization', name: 'Reporte Médico', url: SITE_URL },
    offers: {
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'DOP',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/eventos/${EVENT_SLUG}/inscripcion`,
    },
    subEvent: [
      { '@type': 'Event', name: e.dayTitle, startDate: e.dayStartsAt, endDate: e.dayEndsAt, location: place },
      { '@type': 'Event', name: e.eveningTitle, startDate: e.eveningStartsAt, endDate: e.eveningEndsAt, location: place },
    ],
  }
}

function CtaButton({ open, className = '' }: { open: boolean; className?: string }) {
  if (!open) {
    return (
      <span className={`inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-6 py-3.5 font-bold text-white/70 ${className}`}>
        Inscripciones cerradas
      </span>
    )
  }
  return (
    <Link
      href={`/eventos/${EVENT_SLUG}/inscripcion`}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gold px-6 py-3.5 font-bold text-brand-navy shadow-lg shadow-brand-gold/20 transition hover:bg-brand-gold-light ${className}`}
    >
      Inscríbete gratis <ArrowRight size={18} strokeWidth={2} />
    </Link>
  )
}

export default async function ForoSalud5Page() {
  const e = await loadEvent()
  const dateLong = formatDate(e.dayStartsAt, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const agenda = [
    {
      icon: CalendarDays,
      title: e.dayTitle,
      time: `${formatTime(e.dayStartsAt)} – ${formatTime(e.dayEndsAt)}`,
      where: e.venueName,
      text: '9 paneles estratégicos con los máximos líderes y ejecutivos de los sectores clave de la salud.',
    },
    {
      icon: Sparkles,
      title: e.eveningTitle,
      time: `${formatTime(e.eveningStartsAt)} – ${formatTime(e.eveningEndsAt)}`,
      where: e.eveningVenue ? `${e.eveningVenue} · ${e.venueName}` : e.venueName,
      text: 'Celebración del 5.º aniversario y entrega del reconocimiento "50 Líderes que Transforman la Salud en RD".',
    },
  ]

  return (
    <div className="bg-[var(--color-surface)] pb-24 sm:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd(e)) }} />

      {/* ── Portada ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-brand-navy text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(60% 50% at 15% 10%, rgba(43,181,240,0.35), transparent 70%), radial-gradient(50% 40% at 90% 90%, rgba(0,100,200,0.35), transparent 70%)',
          }}
        />
        <div className="relative max-w-site mx-auto px-4 sm:px-6 pt-10 pb-14 sm:pt-16 sm:pb-20 grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-gold/40 bg-brand-gold/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold">
              5.º aniversario · Summit
            </p>
            <h1 className="mt-5 font-display font-bold leading-[1.05] text-4xl sm:text-6xl">
              Foro de Salud <span className="block">Reporte Médico <span className="text-brand-cyan">5.0</span></span>
            </h1>
            <p className="mt-4 text-sm sm:text-base font-semibold tracking-[0.35em] text-brand-cyan uppercase">
              Innovar · Conectar · Avanzar
            </p>
            <ul className="mt-6 space-y-2 text-white/85">
              <li className="flex items-center gap-2.5">
                <CalendarDays size={18} strokeWidth={1.5} className="text-brand-gold shrink-0" />
                <span className="first-letter:uppercase">{dateLong}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin size={18} strokeWidth={1.5} className="text-brand-gold shrink-0" />
                {e.venueName}, Santo Domingo
              </li>
              <li className="flex items-center gap-2.5">
                <Ticket size={18} strokeWidth={1.5} className="text-brand-gold shrink-0" />
                Evento gratuito · cupos limitados con inscripción
              </li>
            </ul>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <CtaButton open={e.registrationOpen} className="text-base" />
              <a
                href="#paneles"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 font-semibold text-white hover:bg-white/10 transition"
              >
                Ver los 9 paneles <ChevronDown size={18} strokeWidth={1.5} />
              </a>
            </div>
          </div>
          <div className="hidden lg:block">
            <Image
              src="/eventos/foro-salud-5/flyer-foro.png"
              alt="Afiche del Foro de Salud Reporte Médico 5.0: 26 de noviembre de 2026, Hotel Jaragua"
              width={1081}
              height={1351}
              priority
              className="w-full max-w-md ml-auto rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-white/10"
            />
          </div>
        </div>

        {/* Cuenta regresiva */}
        <div className="relative border-t border-white/10 bg-black/20">
          <div className="max-w-site mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <Countdown startsAt={e.dayStartsAt} endsAt={e.eveningEndsAt} />
          </div>
        </div>
      </section>

      {/* ── Qué es ──────────────────────────────────────────── */}
      <section className="max-w-site mx-auto px-4 sm:px-6 py-14 sm:py-20 grid lg:grid-cols-2 gap-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-electric">Un encuentro cumbre</p>
          <h2 className="mt-2 font-display font-bold text-3xl sm:text-4xl text-[var(--color-text-primary)]">
            La hoja de ruta de la salud dominicana
          </h2>
          {INTRO.map((t) => (
            <p key={t} className="mt-4 text-lg leading-relaxed text-[var(--color-text-secondary)]">{t}</p>
          ))}
        </div>
        <dl className="grid grid-cols-3 gap-3 self-center">
          {[
            { n: '9', l: 'paneles estratégicos' },
            { n: '2', l: 'momentos: jornada y gala' },
            { n: '50', l: 'líderes reconocidos' },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 sm:p-6 text-center">
              <dt className="font-display font-bold text-4xl sm:text-5xl text-brand-navy dark:text-brand-cyan">{s.n}</dt>
              <dd className="mt-1 text-xs sm:text-sm text-[var(--color-text-muted)]">{s.l}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Agenda ──────────────────────────────────────────── */}
      <section className="bg-[var(--color-surface-2)] border-y border-[var(--color-border)]">
        <div className="max-w-site mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[var(--color-text-primary)]">Agenda del día</h2>
          <p className="mt-2 text-[var(--color-text-muted)]">
            Al inscribirte eliges si asistes a la jornada, a la gala o a ambas.
          </p>
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            {agenda.map(({ icon: Icon, ...a }) => (
              <article key={a.title} className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
                <Icon size={26} strokeWidth={1.5} className="text-brand-electric dark:text-brand-cyan" />
                <h3 className="mt-3 font-display font-bold text-2xl text-[var(--color-text-primary)]">{a.title}</h3>
                <p className="mt-2 flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
                  <Clock size={16} strokeWidth={1.5} /> {a.time}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                  <MapPin size={16} strokeWidth={1.5} /> {a.where}
                </p>
                <p className="mt-3 text-[var(--color-text-secondary)]">{a.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Paneles ─────────────────────────────────────────── */}
      <section id="paneles" className="max-w-site mx-auto px-4 sm:px-6 py-14 sm:py-20 scroll-mt-20">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-electric">Jornada Científica</p>
        <h2 className="mt-2 font-display font-bold text-3xl sm:text-4xl text-[var(--color-text-primary)]">
          9 paneles, 3 ejes
        </h2>
        <p className="mt-2 text-[var(--color-text-muted)]">Toca un panel para ver de qué se va a hablar.</p>

        <div className="mt-10 space-y-12">
          {AXES.map((axis) => (
            <div key={axis.name}>
              <div className="flex items-baseline gap-3 flex-wrap border-b border-[var(--color-border)] pb-3">
                <h3 className="font-display font-bold text-2xl text-brand-navy dark:text-brand-cyan">{axis.name}</h3>
                <p className="text-sm text-[var(--color-text-muted)]">{axis.summary}</p>
              </div>
              <div className="mt-4 grid gap-3">
                {axis.panels.map((panel) => (
                  <details
                    key={panel.number}
                    className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] open:shadow-md open:border-brand-electric/40 transition"
                  >
                    <summary className="flex cursor-pointer list-none items-start gap-4 p-5 [&::-webkit-details-marker]:hidden">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-navy font-bold text-brand-gold">
                        {panel.number}
                      </span>
                      <span className="flex-1">
                        <span className="block font-bold text-lg text-[var(--color-text-primary)]">{panel.name}</span>
                        <span className="block text-sm text-[var(--color-text-secondary)] mt-0.5">{panel.headline}</span>
                      </span>
                      <ChevronDown
                        size={20}
                        strokeWidth={1.5}
                        className="mt-2 shrink-0 text-[var(--color-text-muted)] transition group-open:rotate-180"
                      />
                    </summary>
                    <div className="px-5 pb-6 sm:pl-[4.75rem]">
                      <p className="font-article italic text-[var(--color-text-secondary)]">“{panel.tagline}”</p>
                      <p className="mt-3 text-[var(--color-text-secondary)]">{panel.description}</p>
                      <ul className="mt-4 grid sm:grid-cols-2 gap-3">
                        {panel.points.map((pt) => (
                          <li key={pt.title} className="rounded-xl bg-[var(--color-surface-2)] p-4">
                            <p className="font-semibold text-sm text-[var(--color-text-primary)]">{pt.title}</p>
                            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{pt.text}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 50 Líderes ──────────────────────────────────────── */}
      <section className="bg-brand-navy text-white">
        <div className="max-w-site mx-auto px-4 sm:px-6 py-14 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">{e.eveningTitle}</p>
            <h2 className="mt-2 font-display font-bold text-3xl sm:text-5xl leading-tight">
              <span className="text-brand-gold">50 Líderes</span> que Transforman la Salud en RD
            </h2>
            <p className="mt-2 uppercase tracking-[0.25em] text-sm text-white/60">“{LEADERS.motto}”</p>
            {LEADERS.paragraphs.map((t) => (
              <p key={t} className="mt-4 text-lg leading-relaxed text-white/85">{t}</p>
            ))}
            <p className="mt-4 text-white/60">{LEADERS.magazine}</p>
          </div>
          <Image
            src="/eventos/foro-salud-5/flyer-50-lideres.png"
            alt="50 Líderes que Transforman la Salud en RD: mosaico de retratos de los homenajeados y la edición especial de la revista"
            width={1241}
            height={1600}
            className="w-full max-w-md mx-auto rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-white/10"
          />
        </div>
      </section>

      {/* ── Cómo funciona el acceso ─────────────────────────── */}
      <section className="max-w-site mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-[var(--color-text-primary)]">Cómo funciona tu acceso</h2>
        <p className="mt-2 text-[var(--color-text-muted)]">Es un evento VIP gratuito: inscribirte es el primer paso.</p>
        <ol className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ACCESS_STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-[var(--color-border)] p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gold/15 font-bold text-amber-700 dark:text-brand-gold">
                {i + 1}
              </span>
              <p className="mt-3 font-bold text-[var(--color-text-primary)]">{s.title}</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Lugar + CTA final ───────────────────────────────── */}
      <section className="bg-[var(--color-surface-2)] border-t border-[var(--color-border)]">
        <div className="max-w-site mx-auto px-4 sm:px-6 py-14 sm:py-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-display font-bold text-3xl text-[var(--color-text-primary)]">{e.venueName}</h2>
            {e.venueAddress && <p className="mt-2 text-[var(--color-text-secondary)]">{e.venueAddress}</p>}
            {e.eveningVenue && (
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">La gala se realiza en el {e.eveningVenue}.</p>
            )}
            {e.mapsUrl && (
              <a
                href={e.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 font-semibold text-brand-electric dark:text-brand-cyan hover:underline"
              >
                <Navigation size={16} strokeWidth={1.5} /> Cómo llegar
              </a>
            )}
          </div>
          <div className="rounded-2xl bg-brand-navy p-6 sm:p-8 text-white">
            <p className="font-display font-bold text-2xl">Asegura tu lugar</p>
            <p className="mt-1 text-white/70">Inscripción gratuita, en menos de un minuto.</p>
            <CtaButton open={e.registrationOpen} className="mt-5 w-full" />
          </div>
        </div>
      </section>

      {/* CTA fijo en el celular */}
      {e.registrationOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-brand-navy/95 backdrop-blur px-4 py-3 sm:hidden">
          <CtaButton open className="w-full" />
        </div>
      )}
    </div>
  )
}
