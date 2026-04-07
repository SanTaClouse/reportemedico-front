import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Newspaper, Globe, Mic2, Smartphone, Mail, Trophy, BarChart3, CheckCircle2, Linkedin } from 'lucide-react'
import { getCouncilMembers } from '@/lib/api'
import ScrollReveal from '@/components/ui/ScrollReveal'
import { cldUrl } from '@/lib/cloudinary'

const SOBRE_DESC =
  'Reporte Médico es la plataforma de salud líder en la República Dominicana. Conectamos profesionales, instituciones y pacientes con lo último en información médica.'

export const metadata: Metadata = {
  title: 'Sobre Nosotros',
  description: SOBRE_DESC,
  alternates: { canonical: '/sobre-nosotros' },
  openGraph: {
    title: 'Sobre Nosotros | Reporte Médico',
    description: SOBRE_DESC,
    url: '/sobre-nosotros',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sobre Nosotros | Reporte Médico',
    description: SOBRE_DESC,
  },
}

const servicios = [
  {
    icon: Newspaper,
    titulo: 'Revista Impresa y Digital',
    descripcion:
      'Publicación de referencia avalada por un Consejo Médico Editorial de 24 médicos líderes. Incluye casos clínicos, especiales temáticos, médicos internacionales invitados y la Guía Médica única en la República Dominicana.',
  },
  {
    icon: Globe,
    titulo: 'Website de Noticias',
    descripcion:
      'reportemedico.com — portal actualizado con lo último en avances médicos, innovación tecnológica y noticias del sector salud.',
  },
  {
    icon: Mic2,
    titulo: 'Video Podcast Semanal',
    descripcion:
      'Producción audiovisual de alto nivel con entrevistas, análisis y tendencias en medicina y salud pública. Disponible en YouTube y en nuestro website con estrenos semanales.',
  },
  {
    icon: Smartphone,
    titulo: 'Redes Sociales',
    descripcion:
      'Presencia activa en todas las plataformas digitales para llegar a un público amplio y diverso a nivel nacional e internacional.',
  },
  {
    icon: Mail,
    titulo: 'Newsletter Semanal',
    descripcion:
      'Más de 25,000 suscriptores reciben información exclusiva cada semana, creando un canal directo de alto impacto con la comunidad médica.',
  },
  {
    icon: Trophy,
    titulo: 'Foro de Innovación y Tecnología Médica',
    descripcion:
      'Evento insignia anual del sector salud en República Dominicana. Reúne líderes del sector público y privado, ejecutivos, inversionistas, aseguradoras y profesionales clave para compartir conocimientos y proyectar el futuro de la salud.',
  },
  {
    icon: BarChart3,
    titulo: 'Marketing Médico',
    descripcion:
      'Estrategias personalizadas de comunicación y posicionamiento para clínicas, laboratorios, hospitales y empresas del sector salud.',
  },
]

const razones = [
  {
    titulo: 'Alcance nacional y digital',
    descripcion:
      'Nuestros canales garantizan visibilidad en todo el país y en la comunidad dominicana en el extranjero.',
  },
  {
    titulo: 'Confianza y credibilidad',
    descripcion:
      'Somos un medio especializado que vela por la ética y la veracidad en la información médica.',
  },
  {
    titulo: 'Innovación constante',
    descripcion:
      'Integramos lo último en comunicación, marketing y tecnología para brindar soluciones efectivas.',
  },
  {
    titulo: 'Red de contactos',
    descripcion:
      'Conectamos a empresas, profesionales y pacientes en un ecosistema de salud integral.',
  },
]

export default async function SobreNosotrosPage() {
  const consejo = await getCouncilMembers().catch(() => [])

  return (
    <main>
      {/* Hero — navy */}
      <section className="relative bg-[var(--brand-navy)] text-white py-16 md:py-24 overflow-hidden">
        {/* Patrón de puntos sutil */}
        <div className="absolute inset-0 sn-hero-dots pointer-events-none" />
        {/* Degradado radial suave desde el centro */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_50%,rgba(0,180,160,0.12),transparent_70%)] pointer-events-none" />

        <div className="relative max-w-site mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center gap-12 md:gap-20">
          <div className="flex-1">
            <p className="hero-anim hero-anim-1 text-[var(--brand-gold)] text-xs font-body font-semibold uppercase tracking-widest mb-4">
              República Dominicana · Plataforma líder en salud
            </p>
            <h1 className="hero-anim hero-anim-2 font-display font-bold text-4xl md:text-5xl leading-tight mb-6">
              La plataforma de salud líder en República Dominicana
            </h1>
            <p className="hero-anim hero-anim-3 text-white/80 text-lg leading-relaxed max-w-xl mb-8">
              En Reporte Médico nos enorgullece conectar profesionales, instituciones y pacientes
              con lo último en información médica, avances tecnológicos y estrategias de
              comunicación en el sector salud.
            </p>
          </div>

          {/* Logo ícono */}
          <div className="flex-shrink-0 hero-anim hero-anim-4">
            <Image
              src="/media/Logo Cuadrado (300 x 300 px) sin fondo.png"
              alt="Reporte Médico"
              width={260}
              height={260}
              priority
              className="rounded-2xl object-contain opacity-90 sn-logo-float"
            />
          </div>
        </div>
      </section>

      {/* Historia */}
      <section className="py-16 bg-[var(--color-surface)]">
        <div className="max-w-article mx-auto px-4 md:px-6">
          <ScrollReveal>
            <h2 className="font-display font-bold text-3xl text-[var(--color-text-primary)] mb-8">
              Nuestra Historia
            </h2>
            <div className="article-body space-y-5">
              <p>
                Reporte Médico nació en el año <strong>2010 en Venezuela</strong> como un proyecto
                innovador orientado a la difusión de información científica y médica de calidad.
                Desde sus inicios, se consolidó como una plataforma de comunicación confiable, que
                sirvió de puente entre profesionales de la salud, instituciones y pacientes, con el
                propósito de educar, informar y generar un impacto positivo en la comunidad médica.
              </p>
              <p>
                Durante una década desarrollamos un engranaje sólido de medios, publicaciones y
                eventos que marcaron un referente en el sector salud de nuestro país de origen.
              </p>
              <p>
                En el año <strong>2020 iniciamos nuestras operaciones en la República Dominicana</strong>,
                trasladando toda esa experiencia y estructura para ponerla al servicio de la comunidad
                médica dominicana. Hoy, en un entorno dinámico y en plena transformación del sector
                salud, Reporte Médico ofrece una plataforma integral de comunicación que combina
                tradición y trayectoria con innovación y tecnología.
              </p>
            </div>
          </ScrollReveal>

          {/* Línea de tiempo */}
          <ScrollReveal className="mt-10">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="sn-timeline-card flex-1 bg-[var(--color-surface-3)] rounded-xl p-6 border-l-4 border-[var(--brand-navy)] hover:shadow-md transition-shadow">
                <div className="text-4xl font-display font-bold text-[var(--brand-gold)] mb-2">2010</div>
                <p className="text-[var(--color-text-secondary)] text-sm">
                  Fundación en Venezuela como plataforma de difusión médica científica.
                </p>
              </div>
              <div className="sn-timeline-card flex-1 bg-[var(--color-surface-3)] rounded-xl p-6 border-l-4 border-[var(--brand-gold)] hover:shadow-md transition-shadow">
                <div className="text-4xl font-display font-bold text-[var(--brand-gold)] mb-2">2020</div>
                <p className="text-[var(--color-text-secondary)] text-sm">
                  Inicio de operaciones en la República Dominicana con estructura y experiencia consolidada.
                </p>
              </div>
              <div className="sn-timeline-card flex-1 bg-[var(--color-surface-3)] rounded-xl p-6 border-l-4 border-[var(--brand-navy)] hover:shadow-md transition-shadow">
                <div className="text-4xl font-display font-bold text-[var(--brand-gold)] mb-2">Hoy</div>
                <p className="text-[var(--color-text-secondary)] text-sm">
                  Plataforma de salud líder en RD con más de 25,000 suscriptores y presencia digital nacional.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="py-16 bg-[var(--color-surface-2)]">
        <ScrollReveal>
          <div className="max-w-site mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-8">
            <div className="sn-timeline-card bg-[var(--color-surface)] rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="font-display font-bold text-2xl text-[var(--brand-navy)] mb-4">
                Nuestra Misión
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                Impulsar la transformación de la comunicación en salud mediante contenidos de calidad,
                estrategias de marketing médico y el uso de plataformas digitales y tradicionales que
                generen valor tanto para profesionales de la salud como para empresas del sector.
              </p>
            </div>
            <div className="sn-timeline-card bg-[var(--color-surface)] rounded-2xl p-8 shadow-sm border-l-4 border-[var(--brand-gold)] hover:shadow-md transition-shadow">
              <h2 className="font-display font-bold text-2xl text-[var(--brand-navy)] mb-4">
                Nuestra Visión
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                Ser el medio de comunicación y referencia más confiable e influyente en el ámbito de
                la salud en la República Dominicana, promoviendo la innovación, la educación médica
                y la difusión responsable de información que impacte positivamente en la sociedad.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Servicios */}
      <section className="py-16 bg-[var(--color-surface)]">
        <div className="max-w-site mx-auto px-4 md:px-6">
          <div className="mb-10 text-center">
            <h2 className="font-display font-bold text-3xl text-[var(--color-text-primary)] mb-3">
              Nuestros Servicios
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-xl mx-auto">
              Un ecosistema integral de medios y servicios diseñado para informar, educar y conectar
              a toda la comunidad médica.
            </p>
          </div>
          <ScrollReveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicios.map((s) => {
                const Icon = s.icon
                return (
                  <div
                    key={s.titulo}
                    className="sn-service-card group bg-[var(--color-surface-2)] rounded-xl p-6 flex flex-col gap-3 border border-[var(--color-border)] hover:border-[var(--brand-gold)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[var(--brand-navy)] flex items-center justify-center group-hover:bg-[var(--brand-gold)] transition-colors duration-300">
                      <Icon size={20} strokeWidth={1.5} className="text-[var(--brand-gold)] group-hover:text-[var(--brand-navy)] transition-colors duration-300" />
                    </div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">{s.titulo}</h3>
                    <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                      {s.descripcion}
                    </p>
                  </div>
                )
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Video institucional */}
      <section className="py-16 bg-[var(--color-surface-2)]">
        <div className="max-w-site mx-auto px-4 md:px-6">
          <div className="mb-8 text-center">
            <h2 className="font-display font-bold text-3xl text-[var(--color-text-primary)] mb-3">
              Conócenos
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-lg mx-auto">
              Un vistazo a quiénes somos y lo que hacemos por la salud en República Dominicana.
            </p>
          </div>
          <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-xl border border-[var(--color-border)]">
            <video
              src="https://res.cloudinary.com/dfppghbdf/video/upload/v1773254256/VID-20241123-WA0005_qux0ll.mp4"
              poster="https://res.cloudinary.com/dfppghbdf/video/upload/so_5/v1773254256/VID-20241123-WA0005_qux0ll.jpg"
              controls
              playsInline
              className="w-full aspect-video bg-black"
              preload="metadata"
            />
          </div>
        </div>
      </section>

      {/* Por qué elegirnos — navy */}
      <section className="py-16 bg-[var(--brand-navy)]">
        <div className="max-w-site mx-auto px-4 md:px-6">
          <h2 className="font-display font-bold text-3xl text-white mb-10 text-center">
            ¿Por qué elegirnos?
          </h2>
          <ScrollReveal>
            <div className="grid sm:grid-cols-2 gap-6">
              {razones.map((r) => (
                <div key={r.titulo} className="sn-razon-item flex gap-4 items-start group">
                  <CheckCircle2
                    size={22}
                    strokeWidth={1.5}
                    className="text-[var(--brand-gold)] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200"
                  />
                  <div>
                    <h3 className="font-semibold text-white mb-1">{r.titulo}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{r.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Consejo Médico Editorial */}
      {consejo.length > 0 && (
        <section className="py-16 bg-[var(--color-surface)]">
          <div className="max-w-site mx-auto px-4 md:px-6">
            <div className="mb-10 text-center">
              <h2 className="font-display font-bold text-3xl text-[var(--color-text-primary)] mb-3">
                Consejo Médico Editorial
              </h2>
              <p className="text-[var(--color-text-secondary)] max-w-xl mx-auto">
                Nuestro contenido está avalado por un equipo de médicos líderes en sus especialidades.
              </p>
            </div>
            <ScrollReveal>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {consejo.map((miembro) => (
                  <div key={miembro.id} className="sn-miembro-card group flex flex-col items-center text-center gap-3">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-[var(--color-surface-2)] border-2 border-[var(--color-border)] group-hover:border-[var(--color-primary)] flex-shrink-0 transition-colors duration-300 group-hover:shadow-lg">
                      {miembro.photo ? (
                        <Image
                          src={cldUrl(miembro.photo, { w: 192, h: 192 })}
                          alt={miembro.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-display font-bold text-[var(--color-text-muted)]">
                          {miembro.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[var(--color-text-primary)] leading-tight">
                        {miembro.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{miembro.role}</p>
                      {miembro.linkedinUrl && (
                        <a
                          href={miembro.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-1.5 text-xs text-[var(--brand-electric)] hover:underline"
                        >
                          <Linkedin size={12} />
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Contacto */}
      <section className="py-16 bg-[var(--color-surface)]">
        <div className="max-w-article mx-auto px-4 md:px-6 text-center">
          <h2 className="font-display font-bold text-3xl text-[var(--color-text-primary)] mb-6">
            Contacto
          </h2>
          <div className="inline-flex flex-col gap-2 text-[var(--color-text-secondary)]">
            <p>Tel: (829) 558-3999</p>
            <p>
              Email:{' '}
              <a
                href="mailto:info@reportemedico.com"
                className="text-[var(--brand-electric)] hover:underline"
              >
                info@reportemedico.com
              </a>
            </p>
            <p>Av. Simón Bolívar, Edif. Profesional Elam's II, 4to piso, Oficina 4D, Santo Domingo, RD</p>
            <p className="mt-2">
              <Link
                href="/politica-editorial"
                className="text-[var(--brand-electric)] hover:underline"
              >
                Política Editorial
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
