import Link from 'next/link'
import Image from 'next/image'

const FOOTER_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/noticias', label: 'Noticias' },
  { href: '/articulos', label: 'Artículos' },
  { href: '/guia-medica', label: 'Guía Médica' },
  { href: '/ediciones', label: 'Ediciones' },
  { href: '/sobre-nosotros', label: 'Sobre Nosotros' },
  { href: '/politica-editorial', label: 'Política Editorial' },
]

export default function Footer() {
  return (
    <footer className="bg-[var(--brand-navy)] mt-16">
      <div className="max-w-site mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <p className="font-display font-bold text-xl text-white mb-1">
              Reporte <span className="text-[var(--brand-gold)]">Médico</span>
            </p>
            <Image
              src="/media/Logo Cuadrado (300 x 300 px) sin fondo.png"
              alt="Reporte Médico"
              width={150}
              height={150}
              priority
              className="rounded-2xl object-contain mb-2"
            />

            <p className="text-sm text-[var(--brand-gold)] font-body italic mb-4">
              Una dosis de información saludable
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.youtube.com/@reportemedico1504"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="text-white/50 hover:text-[var(--brand-gold)] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5V8.5l6.25 3.5-6.25 3.5z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/reportemedicord"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-white/50 hover:text-[var(--brand-gold)] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8 0 3.2 0 3.6-.1 4.8-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1-3.2 0-3.6 0-4.8-.1-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.3 2.2 12c0-3.2 0-3.6.1-4.8C2.4 3.9 4 2.3 7.2 2.3c1.2-.1 1.6-.1 4.8-.1zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1.0 8.3 0 8.7 0 12c0 3.3 0 3.7.1 4.9.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24c3.3 0 3.7 0 4.9-.1 4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9 0-3.3 0-3.7-.1-4.9C23.7 2.7 21.3.3 16.9.1 15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
                </svg>
              </a>
            </div>

            {/* CTA médicos */}
            <Link
              href="/registro-medicos"
              className="inline-flex items-center gap-1.5 mt-5 px-3 py-2 rounded-lg border border-[var(--brand-gold)]/40 text-[var(--brand-gold)] text-xs font-semibold hover:bg-[var(--brand-gold)]/10 transition-colors"
            >
              ¿Eres médico? Súmate gratis →
            </Link>
          </div>

          {/* Nav */}
          <nav>
            <p className="text-xs font-body font-semibold uppercase tracking-widest text-[var(--brand-gold)] mb-3">
              Secciones
            </p>
            <ul className="flex flex-col gap-2">
              {FOOTER_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white/60 hover:text-[var(--brand-gold)] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <p className="text-xs font-body font-semibold uppercase tracking-widest text-[var(--brand-gold)] mb-3">
              Contacto
            </p>
            <div className="text-sm text-white/60 space-y-1.5">
              <p>Tel: (829) 558-3999</p>
              <p>administracion@reportemedico.com</p>
              <p>Av. Simón Bolívar, Edif. Elam's II<br />4to piso, Of. 4D — Santo Domingo, RD</p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/30">
          <span>© {new Date().getFullYear()} Reporte Médico — Todos los derechos reservados</span>
          <span>
            Plataforma desarrollada por{' '}
            <a
              href="https://santiagosamuel.com/dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-[var(--brand-gold)] transition-colors"
            >
              Santiago Samuel
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
