import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Instagram } from 'lucide-react'
import { getBioPublicPage } from '@/lib/api-bio'
import { bioIcon } from '@/lib/bio-icons'
import BioView from './BioView'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Enlaces',
  description: 'Todos los enlaces de Reporte Médico en un solo lugar.',
  // Página utilitaria: fuera del índice para no diluir el SEO del sitio (P7).
  robots: { index: false, follow: true },
  alternates: { canonical: '/bio' },
}

const LOGO_FALLBACK = '/media/Logo Cuadrado (300 x 300 px) sin fondo.png'

export default async function BioPage() {
  const page = await getBioPublicPage().catch(() => null)

  // Página desactivada o inexistente → mensaje sobrio en la misma estética.
  if (!page) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#03103f] via-[#001450] to-[#00263f] px-6 text-center text-white">
        <Image src={LOGO_FALLBACK} alt="Reporte Médico" width={96} height={96} className="mb-6 rounded-2xl" />
        <p className="font-display text-xl font-bold">Reporte Médico</p>
        <p className="mt-2 text-sm text-white/60">Volvemos pronto.</p>
      </div>
    )
  }

  const avatar = page.avatarUrl || LOGO_FALLBACK
  // El pie entra después de la última card (cascada continua)
  const tailDelay = 0.3 + page.links.length * 0.07

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#03103f] via-[#001450] to-[#00263f] text-white">
      <BioView />

      {/* Glows decorativos */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-32 h-72 w-72 rounded-full bg-[var(--brand-gold)]/20 blur-[120px]" />
        <div className="absolute right-[-6rem] top-1/3 h-80 w-80 rounded-full bg-[var(--brand-electric)]/25 blur-[130px]" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-[var(--brand-lila)]/15 blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-6 pb-12 pt-16">
        {/* Avatar */}
        <div className="bio-avatar relative">
          <div className="bio-glow absolute inset-0 -m-1 rounded-full bg-gradient-to-tr from-[var(--brand-gold)] via-[var(--brand-gold-light)] to-[var(--brand-electric)] blur-[2px]" />
          <Image
            src={avatar}
            alt={page.title}
            width={112}
            height={112}
            priority
            className="relative h-28 w-28 rounded-full border-2 border-white/20 bg-[#001450] object-cover shadow-2xl"
          />
        </div>

        {/* Título + subtítulo */}
        <h1 className="bio-anim mt-5 text-center font-display text-2xl font-bold tracking-tight" style={{ animationDelay: '0.12s' }}>
          {page.title}
        </h1>
        <span className="bio-anim mt-2 h-0.5 w-10 rounded-full bg-[var(--brand-gold)]" style={{ animationDelay: '0.18s' }} />
        {page.subtitle && (
          <p className="bio-anim mt-3 max-w-xs text-center text-sm leading-relaxed text-white/65" style={{ animationDelay: '0.24s' }}>
            {page.subtitle}
          </p>
        )}

        {/* Enlaces */}
        <nav className="mt-8 flex w-full flex-col gap-3.5">
          {page.links.length === 0 ? (
            <p className="bio-anim text-center text-sm text-white/40" style={{ animationDelay: '0.3s' }}>
              Pronto agregaremos enlaces.
            </p>
          ) : (
            page.links.map((link, i) => {
              const Icon = bioIcon(link.icon)
              return (
                <div key={link.id} className="bio-anim" style={{ animationDelay: `${0.3 + i * 0.07}s` }}>
                  <a
                    href={`/r/${link.id}`}
                    className="group relative flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--brand-gold)]/40 hover:bg-white/[0.1] hover:shadow-[0_8px_30px_rgba(240,180,20,0.12)]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[var(--brand-gold)] transition-colors group-hover:bg-[var(--brand-gold)]/15">
                      <Icon size={20} strokeWidth={1.75} />
                    </span>
                    <span className="flex-1 text-[15px] font-medium text-white">{link.label}</span>
                    <ArrowUpRight
                      size={18}
                      className="text-white/35 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--brand-gold)]"
                    />
                  </a>
                </div>
              )
            })
          )}
        </nav>

        {/* Redes destacadas */}
        <div className="bio-anim mt-9 flex items-center gap-3" style={{ animationDelay: `${tailDelay + 0.06}s` }}>
          <SocialIcon href="https://instagram.com/reportemedicord" label="Instagram">
            <Instagram size={18} strokeWidth={1.75} />
          </SocialIcon>
        </div>

        {/* Pie */}
        <div className="bio-anim mt-auto pt-10 text-center" style={{ animationDelay: `${tailDelay + 0.16}s` }}>
          <Link
            href="/"
            className="text-xs font-medium tracking-wide text-white/50 transition-colors hover:text-[var(--brand-gold)]"
          >
            reportemedico.com
          </Link>
        </div>
      </main>
    </div>
  )
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/70 transition-all hover:-translate-y-0.5 hover:border-[var(--brand-gold)]/40 hover:text-[var(--brand-gold)]"
    >
      {children}
    </a>
  )
}
