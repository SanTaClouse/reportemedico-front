import Link from 'next/link'
import { Stethoscope, UserPlus, ArrowRight } from 'lucide-react'
import { getSpecialties, getCities, getInsurances } from '@/lib/api-guia'
import GuiaSearchForm from '@/components/guia/GuiaSearchForm'

/**
 * Banda promocional de la Guía Médica en el Home.
 * En vez de describir los filtros, montamos el buscador real (GuiaSearchForm):
 * el usuario filtra acá mismo y cae en /guia-medica ya con la búsqueda aplicada.
 * Navy + dorado (paleta de la guía). Se renderiza tras las Destacadas.
 */
export default async function GuiaMedicaBanner() {
  const [insurances, specialties, cities] = await Promise.all([
    getInsurances().catch(() => []),
    getSpecialties().catch(() => []),
    getCities().catch(() => []),
  ])

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

      <div className="relative px-6 py-8 md:px-12 md:py-10">
        {/* Encabezado */}
        <div className="flex items-start gap-4 md:gap-5 mb-5">
          <div className="guia-float flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[var(--brand-gold)]/15 ring-1 ring-[var(--brand-gold)]/30 flex items-center justify-center shadow-lg shadow-black/20">
            <Stethoscope className="w-7 h-7 md:w-8 md:h-8 text-[var(--brand-gold)]" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <span className="inline-block mb-2 px-3 py-1 rounded-full text-[10px] md:text-[11px] font-body font-semibold uppercase tracking-widest bg-[var(--brand-gold)] text-[#001450]">
              Nuevo · Guía Médica
            </span>
            <h2 className="font-display font-bold text-white text-2xl md:text-3xl leading-tight">
              Encuentra tu médico ideal
            </h2>
            <p className="text-white/80 text-sm md:text-base font-body leading-relaxed mt-1">
              Elige tu seguro (ARS), especialidad y ciudad — o busca por nombre.
            </p>
          </div>
        </div>

        {/* Buscador real: filtra acá y cae en /guia-medica con la búsqueda aplicada */}
        <div className="bg-[var(--color-surface)] rounded-2xl p-3 md:p-4 shadow-xl ring-1 ring-black/5">
          <GuiaSearchForm insurances={insurances} specialties={specialties} cities={cities} compact />
        </div>

        <div className="mt-3">
          <Link
            href="/guia-medica"
            className="inline-flex items-center gap-1 text-xs font-body font-medium text-white/70 hover:text-[var(--brand-gold)] transition-colors"
          >
            Explorar toda la guía
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
          </Link>
        </div>
      </div>

      {/* Franja para médicos: el llamado a sumarse a la guía */}
      <div className="relative border-t border-white/10 px-6 py-4 md:px-12 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-white/85 text-sm font-body inline-flex items-center gap-2.5">
          <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
            <UserPlus className="w-4 h-4 text-[var(--brand-gold)]" strokeWidth={1.8} />
          </span>
          <span>
            ¿Eres médico? <span className="text-white font-semibold">Aparece gratis</span> y recibe
            pacientes directo por WhatsApp.
          </span>
        </p>
        <Link
          href="/registro-medicos"
          className="group inline-flex items-center gap-1.5 text-[var(--brand-gold)] hover:text-[var(--brand-gold-light)] text-sm font-body font-bold whitespace-nowrap transition-colors"
        >
          Crear mi perfil gratis
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.2} />
        </Link>
      </div>
    </div>
  )
}
