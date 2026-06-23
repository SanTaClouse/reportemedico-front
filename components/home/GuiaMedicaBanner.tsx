import Link from 'next/link'
import { Stethoscope, Search } from 'lucide-react'
import { getIndexableCombinations } from '@/lib/api-guia'

const MAX_CHIPS = 6

/**
 * Banda promocional de la Guía Médica en el Home.
 * Lleva al usuario a buscar especialistas. Navy + dorado (paleta de la guía),
 * distinta del verde del banner de WhatsApp. Se renderiza tras las Destacadas.
 */
export default async function GuiaMedicaBanner() {
  const combos = await getIndexableCombinations().catch(() => ({
    specialties: [], cities: [], clinics: [], pairs: [],
  }))
  const chips = combos.specialties.slice(0, MAX_CHIPS)

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#001450] via-[#0A1E5E] to-[#142a6e] shadow-lg ring-1 ring-[var(--brand-gold)]/20">
      {/* Patrón de puntos sutil */}
      <div aria-hidden="true" className="absolute inset-0 sn-hero-dots opacity-70 pointer-events-none" />
      {/* Glow dorado cálido (esquina superior derecha) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_88%_12%,rgba(240,180,20,0.20),transparent_55%)] pointer-events-none"
      />
      {/* Glow turquesa frío (esquina inferior izquierda) — profundidad */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_4%_92%,rgba(0,180,160,0.16),transparent_55%)] pointer-events-none"
      />

      <div className="relative flex flex-col md:flex-row md:items-center gap-6 md:gap-10 px-6 py-9 md:px-12 md:py-11">
        {/* Icono flotante */}
        <div className="guia-float flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[var(--brand-gold)]/15 ring-1 ring-[var(--brand-gold)]/30 flex items-center justify-center shadow-lg shadow-black/20">
          <Stethoscope className="w-8 h-8 md:w-10 md:h-10 text-[var(--brand-gold)]" strokeWidth={1.5} />
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <span className="inline-block mb-2 px-3 py-1 rounded-full text-[10px] md:text-[11px] font-body font-semibold uppercase tracking-widest bg-[var(--brand-gold)] text-[#001450]">
            Nuevo · Guía Médica
          </span>
          <h2 className="font-display font-bold text-white text-2xl md:text-3xl leading-tight mb-2">
            Encuentra tu médico ideal
          </h2>
          <p className="text-white/80 text-sm md:text-base font-body leading-relaxed max-w-xl mb-4">
            Filtra por seguro (ARS), especialidad y ciudad. Perfiles verificados con
            contacto directo por WhatsApp.
          </p>

          {/* Chips de especialidades (solo indexables → nunca páginas vacías) */}
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {chips.map((s) => (
                <Link
                  key={s.slug}
                  href={`/guia-medica/${s.slug}`}
                  className="px-3 py-1 rounded-full text-xs font-medium text-white/90 border border-white/20 hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)] transition-colors"
                >
                  {s.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex-shrink-0">
          <Link
            href="/guia-medica"
            className="guia-cta inline-flex items-center gap-2 bg-[var(--brand-gold)] hover:bg-[var(--brand-gold-light)] text-[#001450] text-sm md:text-base font-body font-bold px-6 py-3 md:px-7 md:py-3.5 rounded-lg transition-all shadow-lg hover:shadow-[var(--brand-gold)]/30 hover:-translate-y-0.5 whitespace-nowrap"
          >
            <Search className="w-5 h-5" strokeWidth={2} />
            Buscar mi médico
          </Link>
        </div>
      </div>
    </div>
  )
}
