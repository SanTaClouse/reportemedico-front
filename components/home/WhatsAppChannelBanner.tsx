import Link from 'next/link'

const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb62yg7A89Moeg3n5y0E'

/**
 * Banner invitando a seguir el canal de WhatsApp de Reporte Médico.
 * Se renderiza al final del Home, debajo de "Sobre Nosotros".
 */
export default function WhatsAppChannelBanner() {
  return (
    <section className="py-14">
      <div className="max-w-site mx-auto px-4 md:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b3d2e] via-[#128C7E] to-[#25D366] shadow-lg">
          {/* Ornamento de fondo */}
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute -left-10 -bottom-20 w-72 h-72 rounded-full bg-white/5 blur-3xl"
          />

          <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10 px-6 py-10 md:px-12 md:py-12 text-center md:text-left">
            {/* Icono WhatsApp */}
            <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/25">
              <WhatsAppIcon className="w-11 h-11 md:w-14 md:h-14 text-white" />
            </div>

            {/* Texto */}
            <div className="flex-1">
              <span className="inline-block mb-2 px-3 py-1 rounded-full text-[10px] md:text-[11px] font-body font-semibold uppercase tracking-widest bg-white/20 text-white">
                Canal oficial
              </span>
              <h2 className="font-display font-bold text-white text-2xl md:text-3xl leading-tight mb-2">
                Síguenos en WhatsApp
              </h2>
              <p className="text-white/85 text-sm md:text-base font-body leading-relaxed max-w-xl md:max-w-2xl">
                Recibe las noticias de salud más importantes de República Dominicana
                directo en tu teléfono. Sin spam, solo lo esencial.
              </p>
            </div>

            {/* CTA */}
            <div className="flex-shrink-0">
              <Link
                href={WHATSAPP_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white hover:bg-white/90 text-[#128C7E] text-sm md:text-base font-body font-bold px-6 py-3 md:px-7 md:py-3.5 rounded-lg transition-colors shadow-lg whitespace-nowrap"
              >
                <WhatsAppIcon className="w-5 h-5" />
                Unirme al canal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function WhatsAppIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}
