import Link from 'next/link'
import Image from 'next/image'
import { BadgeCheck, MapPin, Monitor, ArrowRight } from 'lucide-react'
import { cldUrl } from '@/lib/cloudinary'
import { getPublicDoctors } from '@/lib/api-guia'

/**
 * Vitrina de médicos en el Home, justo ARRIBA del banner de la Guía Médica.
 * Cards verticales (foto arriba, datos abajo) — al paciente le muestra quién
 * está y al médico que su perfil puede verse así de bien. El public-list ya
 * viene ordenado (premium → verificado → completitud → rotación diaria), así
 * que los primeros son buenas vitrinas y van rotando solos cada día.
 */
export default async function FeaturedDoctors() {
  const doctors = await getPublicDoctors({}).catch(() => [])
  const featured = doctors.slice(0, 5)
  if (featured.length === 0) return null

  return (
    <section aria-labelledby="home-medicos">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h2 id="home-medicos" className="font-display font-bold text-xl md:text-2xl text-[var(--color-text-primary)] leading-tight">
            Conoce a nuestros médicos
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Profesionales verificados, listos para atenderte.
          </p>
        </div>
        <Link
          href="/guia-medica"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] hover:underline shrink-0"
        >
          Ver todos <ArrowRight size={15} strokeWidth={2.2} />
        </Link>
      </div>

      {/* Mobile: carrusel horizontal (swipe). Desktop (md+): grilla que llena el
          ancho — tantas columnas como médicos, sin huecos a los lados. */}
      <div
        className="flex gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-2 md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:grid [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ gridTemplateColumns: `repeat(${featured.length}, minmax(0, 1fr))` }}
      >
        {featured.map((doc) => {
          const fullName = `${doc.title ?? ''} ${doc.firstName} ${doc.lastName}`.trim()
          const city = doc.clinics[0]?.city?.name
          return (
            <Link
              key={doc.id}
              href={`/medico/${doc.slug}`}
              className="group flex flex-col rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] hover:shadow-lg hover:-translate-y-0.5 transition-all snap-start shrink-0 w-[46%] md:w-auto"
            >
              {/* Foto (vertical) */}
              <div className="relative aspect-[4/5] bg-[var(--color-primary,#001450)]">
                {doc.photoUrl ? (
                  <Image
                    src={cldUrl(doc.photoUrl, { w: 480, h: 600 })}
                    alt={`${fullName}, ${doc.specialties[0]?.name ?? 'médico'}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 46vw, 20vw"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center font-display text-4xl font-bold text-white/90">
                    {doc.firstName[0]}{doc.lastName[0]}
                  </span>
                )}
                {doc.isVerified && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/95 text-[var(--color-primary,#001450)] text-[10px] font-semibold shadow-sm">
                    <BadgeCheck size={12} /> Verificado
                  </span>
                )}
              </div>

              {/* Datos */}
              <div className="p-3.5 flex flex-col gap-1 flex-1">
                <h3 className="font-display font-bold text-base text-[var(--color-text-primary)] leading-snug group-hover:text-[var(--color-primary)] transition-colors">
                  {fullName}
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
          )
        })}
      </div>
    </section>
  )
}
