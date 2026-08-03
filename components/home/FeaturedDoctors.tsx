import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getPublicDoctors } from '@/lib/api-guia'
import FeaturedDoctorsTrack from './FeaturedDoctorsTrack'

/**
 * Vitrina de médicos en el Home, justo ARRIBA del banner de la Guía Médica.
 * Este componente (servidor) solo trae los datos; el desplazamiento horizontal
 * automático vive en FeaturedDoctorsTrack (cliente). El public-list ya viene
 * ordenado (premium → verificado → completitud → rotación diaria).
 */
export default async function FeaturedDoctors() {
  const doctors = await getPublicDoctors({}).catch(() => [])
  // Más médicos que antes: el loop se ve mejor con una tira larga.
  const featured = doctors.slice(0, 12)
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

      <FeaturedDoctorsTrack doctors={featured} />
    </section>
  )
}
