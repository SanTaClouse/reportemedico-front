import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

interface Props {
  /** Se mantiene por compatibilidad con las llamadas; el banner es autónomo. */
  variant?: 'light' | 'dark'
  className?: string
}

/**
 * CTA de captación de médicos. Muestra el banner de marca "Eres Doctor"
 * (diseño provisto por el cliente, 2026-07-27) ENTERO — antes recortaba una
 * foto a la mitad, pero este asset ya trae su propio mensaje, tarjeta de
 * ejemplo y redes, así que se muestra completo y clickeable, con una barra de
 * acción abajo que deja explícito el "crear perfil gratis".
 */
export default function MedicoCta({ className = '' }: Props) {
  return (
    <section
      aria-labelledby="cta-medico"
      className={`overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-sm ${className}`}
    >
      <Link
        href="/registro-medicos"
        className="group block"
        aria-label="¿Eres médico? Crea tu perfil gratis en la Guía Médica"
      >
        <Image
          src="/media/banner-eres-doctor.webp"
          alt="Suma tu perfil profesional a la Guía Médica de Reporte Médico: impresa, digital y en redes"
          width={2400}
          height={1191}
          className="w-full h-auto"
          sizes="(max-width: 1280px) 100vw, 1200px"
          priority={false}
        />

        {/* Barra de acción — el banner no dice "regístrate", así que el CTA va acá */}
        <div className="flex items-center justify-center sm:justify-between gap-3 flex-wrap bg-[var(--color-surface)] px-5 py-4">
          <p id="cta-medico" className="font-display font-bold text-sm md:text-base text-[var(--color-text-primary)]">
            ¿Eres médico? Suma tu perfil hoy — es gratis.
          </p>
          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gold text-[var(--color-primary,#001450)] text-sm font-bold shadow-lg shadow-brand-gold/25 transition-transform group-hover:-translate-y-0.5">
            Crear mi perfil gratis
            <ArrowRight size={16} strokeWidth={2.2} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </section>
  )
}
