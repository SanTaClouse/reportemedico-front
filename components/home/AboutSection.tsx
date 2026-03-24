import Link from 'next/link'
import { Newspaper, Mic2, Mail, Trophy } from 'lucide-react'

const highlights = [
  { icon: Newspaper, label: 'Revista con Consejo Editorial de 24 médicos' },
  { icon: Mic2,      label: 'Video podcast semanal en YouTube' },
  { icon: Mail,      label: '+25,000 suscriptores en newsletter' },
  { icon: Trophy,    label: 'Foro de Innovación y Tecnología Médica anual' },
]

export default function AboutSection() {
  return (
    <section className="relative bg-[var(--color-primary-pale)] dark:bg-[var(--color-surface-2)] py-16 overflow-hidden">
      {/* Watermark decorativo */}
      <span className="absolute right-0 top-1/2 -translate-y-1/2 font-display font-bold text-[180px] md:text-[220px] leading-none text-[var(--color-primary)] opacity-[0.04] select-none pointer-events-none">
        2010
      </span>

      <div className="relative max-w-site mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Texto */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-3">
              Desde 2010
            </p>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-[var(--color-text-primary)] mb-4">
              La plataforma de salud líder en la República Dominicana
            </h2>
            <p className="text-[var(--color-text-secondary)] text-base leading-relaxed mb-6">
              En Reporte Médico ofrecemos un ecosistema integral de medios y servicios diseñado para
              informar, educar y conectar a toda la comunidad médica, generando un impacto positivo
              en el desarrollo del sector salud del país.
            </p>
            <Link
              href="/sobre-nosotros"
              className="inline-flex items-center gap-1 bg-[var(--color-primary)] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Conocer más →
            </Link>
          </div>

          {/* Highlights con stagger */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {highlights.map((h) => {
              const Icon = h.icon
              return (
                <div
                  key={h.label}
                  className="about-card bg-[var(--color-surface-1)] rounded-xl px-5 py-4 flex items-center gap-3 shadow-sm"
                >
                  <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-pale)] flex items-center justify-center flex-shrink-0">
                    <Icon size={18} strokeWidth={1.5} className="text-[var(--color-primary)]" />
                  </div>
                  <p className="text-[var(--color-text-primary)] text-sm font-medium leading-snug">
                    {h.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
