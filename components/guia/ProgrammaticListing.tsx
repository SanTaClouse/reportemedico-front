import Link from 'next/link'
import DoctorCard from './DoctorCard'
import ClinicsMap from './ClinicsMap'
import type { PublicDoctorCard } from '@/lib/api-guia'

interface Props {
  doctors: PublicDoctorCard[]
  /** Texto introductorio único de facto (03 §7 fase 1): se arma con datos reales */
  intro: string
  /** Chips de interlinking — SOLO combinaciones indexables (P7) */
  chips?: { href: string; label: string }[]
  chipsTitle?: string
}

export default function ProgrammaticListing({ doctors, intro, chips = [], chipsTitle }: Props) {
  const pins = doctors
    .flatMap((d) => d.clinics)
    .filter((c, i, arr) => arr.findIndex((x) => x.slug === c.slug) === i)
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({ latitude: c.latitude!, longitude: c.longitude!, label: c.name, sublabel: c.address }))

  return (
    <>
      <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] max-w-2xl mb-6">{intro}</p>

      {chips.length > 0 && (
        <div className="mb-6">
          {chipsTitle && (
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
              {chipsTitle}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <Link
                key={chip.href}
                href={chip.href}
                className="px-2.5 py-1 rounded-full text-xs font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] transition-colors"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {doctors.map((doc) => (
          <DoctorCard key={doc.id} doctor={doc} source="search-card" />
        ))}
      </div>

      {/* El mapa va bajo el listado: la lista es el contenido SSR, el mapa no bloquea LCP (03 §9) */}
      {pins.length > 0 && <ClinicsMap pins={pins} />}
    </>
  )
}
