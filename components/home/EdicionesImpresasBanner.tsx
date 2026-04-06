import Link from 'next/link'
import ParallaxImage from '@/components/ui/ParallaxImage'

interface Props {
    priority?: boolean
    heading?: string
}

export default function EdicionesImpresasBanner({
    priority = false,
    heading = 'Innovación, verdad y acción: así contamos la salud como nadie más.',
}: Props) {
    return (
        <div className="relative rounded-2xl overflow-hidden bg-[var(--brand-navy)] h-[340px] md:h-[360px]">
            <ParallaxImage
                src="https://res.cloudinary.com/dfppghbdf/image/upload/v1775494245/Reporte-Medico/Media/20260406_jonas-jacobsson-0frj2scuy4k-unsplash.jpg"
                alt="Médicos publicando en Reporte Médico"
                priority={priority}
                className="opacity-50"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5 md:px-16 bg-gradient-to-t from-[#001450]/80 via-[#001450]/40 to-transparent">
                <span className="inline-block mb-2 md:mb-3 px-3 py-1 rounded-full text-[10px] md:text-[11px] font-body font-semibold uppercase tracking-widest bg-[var(--brand-gold)] text-[var(--brand-navy)]">
                    Espacio para profesionales
                </span>
                <h2 className="font-display font-bold text-white text-xl md:text-4xl leading-tight mb-2 md:mb-3 max-w-2xl">
                    {heading}
                </h2>
                <p className="text-white/75 text-xs md:text-base max-w-xl mb-4 md:mb-6 font-body leading-relaxed">
                    <span className="hidden md:inline">Conocé nuestras ediciones impresas, la revista número uno de salud de República Dominicana.
                    </span>Aquí publicamos la plataforma que marca la diferencia en la comunicación de salud del país:
                    <span className="hidden md:inline"> reportajes, entrevistas y análisis con el rigor que nuestros lectores merecen.</span>
                </p>
                <Link
                    href="/ediciones"
                    className="inline-flex items-center gap-2 bg-[var(--brand-gold)] hover:bg-[var(--brand-gold-light)] text-[var(--brand-navy)] text-sm font-body font-bold px-5 py-2.5 md:px-6 md:py-3 rounded-lg transition-colors shadow-lg"
                >
                    Leer ediciones impresas →
                </Link>
            </div>
        </div>
    )
}
