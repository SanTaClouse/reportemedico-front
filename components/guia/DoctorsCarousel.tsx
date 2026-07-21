import Link from 'next/link'
import Image from 'next/image'
import { MapPin } from 'lucide-react'
import { cldUrl } from '@/lib/cloudinary'
import PlanBadge, { planCardClass } from './PlanBadge'
import VerifiedBadge from './VerifiedBadge'
import type { PublicDoctorCard } from '@/lib/api-guia'

/**
 * Carrusel de médicos en la landing de la guía: marquee infinito que rota solo
 * (se pausa al pasar el cursor; se detiene si el usuario pidió menos movimiento).
 * Es decorativo/de descubrimiento — la búsqueda real está arriba.
 */
export default function DoctorsCarousel({ doctors }: { doctors: PublicDoctorCard[] }) {
  if (doctors.length < 3) return null
  // Duplicamos la lista para que el loop sea continuo (la animación traslada -50%).
  const loop = [...doctors, ...doctors]

  return (
    <section aria-label="Médicos en la guía" className="mb-10">
      <h2 className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-3">
        Médicos en la guía
      </h2>
      <div className="relative overflow-hidden">
        {/* Difuminado en los bordes (fx) */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-10 md:w-16 z-10 bg-gradient-to-r from-[var(--color-surface)] to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-10 md:w-16 z-10 bg-gradient-to-l from-[var(--color-surface)] to-transparent" />
        <ul className="guia-marquee flex w-max gap-4 py-1">
          {loop.map((doc, i) => {
            const fullName = `${doc.title ?? ''} ${doc.firstName} ${doc.lastName}`.trim()
            const city = doc.clinics[0]?.city?.name
            return (
              <li key={`${doc.id}-${i}`} className="shrink-0" aria-hidden={i >= doctors.length}>
                <Link
                  href={`/medico/${doc.slug}`}
                  tabIndex={i >= doctors.length ? -1 : undefined}
                  className={`flex items-center gap-3 w-64 bg-[var(--color-surface)] rounded-xl p-3 hover:shadow-md transition-all ${planCardClass(doc.plan)}`}
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-[var(--color-primary,#001450)] flex items-center justify-center relative shrink-0">
                    {doc.photoUrl ? (
                      <Image src={cldUrl(doc.photoUrl, { w: 112, h: 112 })} alt={fullName} fill className="object-cover" sizes="56px" />
                    ) : (
                      <span className="font-display text-base font-bold text-white">
                        {doc.firstName[0]}{doc.lastName[0]}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm text-[var(--color-text-primary)] leading-tight flex items-center gap-1">
                      <span className="truncate">{fullName}</span>
                      {doc.isVerified && <VerifiedBadge size={13} />}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-secondary)] truncate mt-0.5 flex items-center gap-1.5">
                      <span className="truncate">{doc.specialties[0]?.name ?? 'Médico'}</span>
                      <PlanBadge plan={doc.plan} />
                    </p>
                    {city && (
                      <p className="text-[11px] text-[var(--color-text-muted)] truncate inline-flex items-center gap-1">
                        <MapPin size={10} /> {city}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
