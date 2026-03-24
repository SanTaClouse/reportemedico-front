import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Linkedin, BookOpen, Users } from 'lucide-react'
import { getCouncilMembers } from '@/lib/api'
import type { CouncilMember } from '@/lib/api'

export const metadata: Metadata = {
  title: 'Consejo Médico Editorial | Reporte Médico',
  description:
    'Conoce a los profesionales que conforman el Consejo Médico Editorial de Reporte Médico — el brazo estratégico y decisor que guía los estándares y el impacto de nuestra plataforma.',
}

export const revalidate = 3600

export default async function ConsejoMedicoPage() {
  const members = await getCouncilMembers().catch(() => [] as CouncilMember[])
  const featured = members.find((m) => m.isFeatured) ?? null

  return (
    <main>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative bg-[var(--brand-navy)] text-white overflow-hidden">
        {/* Fondo fijo */}
        <div className="absolute inset-0">
          <Image
            src="https://res.cloudinary.com/dfppghbdf/image/upload/v1773767746/Reporte-Medico/Noticias/20260317_doble-pagina-yo.jpg"
            alt="Consejo Médico Editorial"
            fill
            className="object-cover object-[75%_center] opacity-50"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-navy)] via-[var(--brand-navy)]/90 to-[var(--brand-navy)]/40" />
        </div>

        <div className="relative max-w-site mx-auto px-4 md:px-6 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12 md:gap-20">
          {/* Texto */}
          <div className="flex-1 max-w-2xl">
            <p className="text-[var(--brand-gold)] text-xs font-body font-semibold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Users size={14} strokeWidth={1.5} />
              Reporte Médico
            </p>
            <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight mb-6">
              Consejo Médico Editorial
            </h1>
            <p className="text-white/80 text-lg leading-relaxed mb-6">
              Hay proyectos que nacen de una visión y otros que se forjan desde una vocación.
              Reporte Médico pertenece a ambos mundos. En la República Dominicana, ha logrado lo
              que a muchos medios les toma décadas: construir una comunidad sólida, generar
              credibilidad en el sector salud y convertirse en punto de encuentro para quienes
              viven la medicina desde la pasión y la innovación.
            </p>
            <p className="text-white/70 leading-relaxed mb-8">
              Desde su llegada en 2020, Reporte Médico ha tejido una red de conocimiento y
              colaboración que trasciende la información: es un espacio donde la ciencia, la
              comunicación y el compromiso se unen para impulsar el bienestar nacional.
            </p>

            <div className="border-l-4 border-[var(--brand-gold)] pl-4">
              <p className="text-white font-display font-semibold text-lg">Lic. Alberto Rodriguez Fonseca</p>
              <p className="text-white/60 text-sm font-body">Presidente · Reporte Médico</p>
            </div>
          </div>

          {/* Foto del featured */}
          {featured?.photo && (
            <div className="flex-shrink-0 relative">
              <div className="w-72 h-80 md:w-80 md:h-96 rounded-2xl overflow-hidden shadow-2xl border-2 border-[var(--brand-gold)]/30">
                <Image
                  src={featured.photo}
                  alt={featured.name}
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
              {/* Badge dorado */}
              <div className="absolute -bottom-4 -left-4 bg-[var(--brand-gold)] text-[var(--brand-navy)] px-4 py-2 rounded-xl shadow-lg">
                <p className="font-display font-bold text-sm leading-tight">{featured.name}</p>
                <p className="text-xs font-body opacity-80">{featured.role}</p>
              </div>
            </div>
          )}

          {/* Si no hay featured, mostrar logo */}
          {!featured?.photo && (
            <div className="flex-shrink-0 opacity-20">
              <Image
                src="/media/Logo Cuadrado (300 x 300 px) sin fondo.png"
                alt="Reporte Médico"
                width={220}
                height={220}
                className="object-contain"
              />
            </div>
          )}
        </div>
      </section>

      {/* ── DESCRIPCIÓN DEL CONSEJO ───────────────────────── */}
      <section className="py-14 bg-[var(--color-surface-2)]">
        <div className="max-w-article mx-auto px-4 md:px-6 text-center">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-[var(--color-text-primary)] mb-4">
            ¿Quiénes conforman el Consejo?
          </h2>
          <p className="text-[var(--color-text-secondary)] text-lg leading-relaxed max-w-2xl mx-auto">
            Nuestro Consejo Médico Editorial está conformado por los profesionales que respaldan
            la credibilidad y la dirección editorial de Reporte Médico. Aunque muchos son médicos
            en ejercicio activo, su rol trasciende la práctica clínica: son el brazo estratégico
            y decisor que guía el contenido, los estándares y el impacto de nuestra plataforma.
          </p>
        </div>
      </section>

      {/* ── GRID DE MIEMBROS ─────────────────────────────── */}
      <section className="py-16 bg-[var(--color-surface)]">
        <div className="max-w-site mx-auto px-4 md:px-6">
          {members.length === 0 ? (
            <p className="text-center text-[var(--color-text-muted)] py-20">
              Próximamente los miembros del Consejo Editorial.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {members.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA — Ediciones ──────────────────────────────── */}
      <section className="py-16 bg-[var(--brand-navy)]">
        <div className="max-w-article mx-auto px-4 md:px-6 text-center">
          <BookOpen
            size={40}
            strokeWidth={1}
            className="text-[var(--brand-gold)] mx-auto mb-4"
          />
          <h2 className="font-display font-bold text-3xl text-white mb-4">
            Conoce nuestras ediciones impresas
          </h2>
          <p className="text-white/70 max-w-lg mx-auto mb-8">
            Cada edición es avalada por nuestro Consejo Médico Editorial. Descubre años de
            contenido de salud de calidad en nuestras revistas digitales.
          </p>
          <Link
            href="/ediciones"
            className="inline-flex items-center gap-2 bg-[var(--brand-gold)] text-[var(--brand-navy)] font-semibold px-7 py-3.5 rounded-xl hover:bg-[var(--brand-gold-light)] transition-colors shadow-lg"
          >
            <BookOpen size={18} strokeWidth={1.5} />
            Ver ediciones impresas
          </Link>
        </div>
      </section>
    </main>
  )
}

function MemberCard({ member }: { member: CouncilMember }) {
  const card = (
    <div className="group flex flex-col items-center text-center gap-3 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--brand-gold)] hover:shadow-md transition-all duration-200 cursor-default">
      {/* Foto */}
      <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-[var(--color-surface-3)] flex-shrink-0 ring-2 ring-[var(--color-border)] group-hover:ring-[var(--brand-gold)] transition-all">
        {member.photo ? (
          <Image
            src={member.photo}
            alt={member.name}
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 96px, 112px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--brand-navy)]/10">
            <span className="text-2xl font-display font-bold text-[var(--brand-navy)]/30">
              {member.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <p className="font-semibold text-sm text-[var(--color-text-primary)] leading-snug">
          {member.name}
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-snug">
          {member.role}
        </p>
      </div>

      {/* LinkedIn */}
      {member.linkedinUrl && (
        <Linkedin
          size={14}
          strokeWidth={1.5}
          className="text-[var(--brand-electric)] opacity-0 group-hover:opacity-100 transition-opacity"
        />
      )}
    </div>
  )

  if (member.linkedinUrl) {
    return (
      <a
        href={member.linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {card}
      </a>
    )
  }

  return card
}
