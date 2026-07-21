import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BadgeCheck, MessageCircle, Search } from 'lucide-react'

interface Props {
  /**
   * `light`: card propia sobre fondo claro (home de la guía).
   * `dark`: sobre el navy del banner del home — sin fondo propio.
   */
  variant?: 'light' | 'dark'
  className?: string
}

const PERKS = [
  { icon: Search, text: 'Te encuentran en Google y en la guía' },
  { icon: MessageCircle, text: 'Pacientes te escriben por WhatsApp' },
  { icon: BadgeCheck, text: 'Perfil profesional con tu especialidad' },
]

/**
 * CTA de captación de médicos. Va como card APARTE (no dentro del buscador):
 * meterlo en el form le compite la atención al paciente, que es la tarea
 * principal de esa página. Foto + botón grande, a pedido del cliente (2026-07-21).
 */
export default function MedicoCta({ variant = 'light', className = '' }: Props) {
  const dark = variant === 'dark'

  return (
    <section
      aria-labelledby="cta-medico"
      className={`overflow-hidden rounded-2xl ${
        dark
          ? 'bg-white/[0.06] ring-1 ring-white/15'
          : 'bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm'
      } ${className}`}
    >
      <div className="grid md:grid-cols-2 items-stretch">
        {/* Foto */}
        <div className="relative h-48 md:h-auto md:min-h-[15rem]">
          <Image
            src="/media/medicos-guia-cta.webp"
            alt="Dos médicos revisando su perfil profesional en una computadora portátil"
            fill
            /* El encuadre útil (los dos médicos) está a la derecha de la foto */
            className="object-cover object-[65%_center]"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          {/* Funde SOLO el borde derecho contra el panel de texto. Ojo: el color
              opaco tiene que arrancar tarde (75%) o se come la foto entera. */}
          <div
            aria-hidden="true"
            className={`absolute inset-0 hidden md:block bg-gradient-to-r from-transparent from-75% ${
              dark ? 'to-[#0d2260]' : 'to-[var(--color-surface)]'
            }`}
          />
        </div>

        {/* Contenido */}
        <div className="p-6 md:p-8 flex flex-col justify-center">
          <span
            className={`inline-block self-start mb-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              dark
                ? 'bg-brand-gold text-[var(--color-primary,#001450)]'
                : 'bg-[var(--color-primary-pale,#e8edf8)] text-[var(--color-primary,#001450)]'
            }`}
          >
            Para médicos
          </span>

          <h2
            id="cta-medico"
            className={`font-display font-bold text-2xl md:text-[1.75rem] leading-tight ${
              dark ? 'text-white' : 'text-[var(--color-text-primary)]'
            }`}
          >
            ¿Eres médico?
          </h2>
          <p
            className={`text-sm mt-2 leading-relaxed ${
              dark ? 'text-white/80' : 'text-[var(--color-text-secondary)]'
            }`}
          >
            Crea tu perfil en la Guía Médica y conecta con los pacientes que están buscando un
            especialista como tú.
          </p>

          <ul className="mt-4 space-y-2">
            {PERKS.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className={`flex items-center gap-2 text-sm ${
                  dark ? 'text-white/75' : 'text-[var(--color-text-secondary)]'
                }`}
              >
                <Icon
                  size={15}
                  strokeWidth={1.5}
                  className={`shrink-0 ${
                    dark ? 'text-brand-gold' : 'text-[var(--color-primary)]'
                  }`}
                />
                {text}
              </li>
            ))}
          </ul>

          <Link
            href="/registro-medicos"
            className="group mt-6 inline-flex items-center justify-center gap-2 self-start px-6 py-3.5 rounded-xl bg-brand-gold text-[var(--color-primary,#001450)] text-base font-bold shadow-lg shadow-brand-gold/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Crear mi perfil gratis
            <ArrowRight
              size={18}
              strokeWidth={2.2}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
          <p className={`text-xs mt-2.5 ${dark ? 'text-white/55' : 'text-[var(--color-text-muted)]'}`}>
            Es gratis. Con tu cuenta de Google o con email.
          </p>
        </div>
      </div>
    </section>
  )
}
