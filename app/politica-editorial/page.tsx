import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ShieldCheck,
  BookOpenCheck,
  Users,
  AlertCircle,
  Mail,
  RefreshCw,
  Scale,
  Stethoscope,
} from 'lucide-react'

const POLITICA_DESC =
  'Política editorial de Reporte Médico: cómo verificamos la información médica, qué fuentes utilizamos, cómo manejamos correcciones y cómo garantizamos la independencia editorial en nuestros contenidos.'

export const metadata: Metadata = {
  title: 'Política Editorial',
  description: POLITICA_DESC,
  alternates: { canonical: '/politica-editorial' },
  openGraph: {
    title: 'Política Editorial | Reporte Médico',
    description: POLITICA_DESC,
    url: '/politica-editorial',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Política Editorial | Reporte Médico',
    description: POLITICA_DESC,
  },
}

const principios = [
  {
    icon: ShieldCheck,
    titulo: 'Independencia editorial',
    descripcion:
      'Nuestras decisiones editoriales son tomadas por el equipo de redacción y el Consejo Médico Editorial, sin influencia comercial ni política. Los contenidos patrocinados se identifican siempre de forma explícita.',
  },
  {
    icon: BookOpenCheck,
    titulo: 'Verificación de fuentes',
    descripcion:
      'Cada noticia y artículo se basa en fuentes verificables: organismos oficiales (OMS, OPS, Ministerio de Salud Pública de RD), publicaciones científicas revisadas por pares, comunicados institucionales y entrevistas a especialistas.',
  },
  {
    icon: Stethoscope,
    titulo: 'Revisión médica',
    descripcion:
      'Los contenidos médicos relevantes son revisados por nuestro Consejo Médico Editorial, integrado por especialistas en activo de las principales áreas de la medicina dominicana.',
  },
  {
    icon: AlertCircle,
    titulo: 'Información, no diagnóstico',
    descripcion:
      'El contenido publicado tiene fines informativos y educativos. No sustituye la consulta con un profesional de la salud. Siempre recomendamos a nuestros lectores acudir a un médico ante cualquier síntoma o duda sobre su salud.',
  },
  {
    icon: RefreshCw,
    titulo: 'Correcciones y actualizaciones',
    descripcion:
      'Cuando detectamos un error, lo corregimos de forma transparente: actualizamos el artículo, reflejamos la fecha de modificación y, en errores graves, añadimos una nota aclaratoria al pie.',
  },
  {
    icon: Scale,
    titulo: 'Conflictos de interés',
    descripcion:
      'Cuando un autor o entrevistado tiene una relación comercial, institucional o profesional relevante con el tema tratado, lo declaramos abiertamente dentro del artículo.',
  },
]

const fuentes = [
  {
    nombre: 'Organización Mundial de la Salud (OMS)',
    url: 'https://www.who.int/es',
  },
  {
    nombre: 'Organización Panamericana de la Salud (OPS)',
    url: 'https://www.paho.org/es',
  },
  {
    nombre: 'Ministerio de Salud Pública de la República Dominicana',
    url: 'https://msp.gob.do',
  },
  {
    nombre: 'PubMed — Biblioteca Nacional de Medicina de EE.UU.',
    url: 'https://pubmed.ncbi.nlm.nih.gov',
  },
  {
    nombre: 'The Lancet, NEJM, JAMA y otras revistas indexadas',
  },
  {
    nombre: 'Comunicados oficiales de sociedades médicas dominicanas',
  },
]

export default function PoliticaEditorialPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-[var(--brand-navy)] text-white py-16 md:py-20">
        <div className="max-w-article mx-auto px-4 md:px-6">
          <p className="text-[var(--brand-gold)] text-xs font-semibold uppercase tracking-widest mb-3">
            Transparencia editorial
          </p>
          <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight mb-5">
            Nuestra Política Editorial
          </h1>
          <p className="text-white/80 text-lg leading-relaxed max-w-2xl">
            En Reporte Médico creemos que la información médica debe ser veraz, verificable y accesible.
            Estos son los principios que guían cada noticia y cada artículo que publicamos.
          </p>
        </div>
      </section>

      {/* Principios */}
      <section className="py-16 bg-[var(--color-surface)]">
        <div className="max-w-site mx-auto px-4 md:px-6">
          <div className="mb-10 text-center">
            <h2 className="font-display font-bold text-3xl text-[var(--color-text-primary)] mb-3">
              Principios editoriales
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-xl mx-auto">
              Seis compromisos que asumimos con nuestros lectores, anunciantes y con la comunidad médica de la República Dominicana.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {principios.map((p) => {
              const Icon = p.icon
              return (
                <div
                  key={p.titulo}
                  className="bg-[var(--color-surface-2)] rounded-xl p-6 border border-[var(--color-border)] flex flex-col gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--brand-navy)] flex items-center justify-center">
                    <Icon size={20} strokeWidth={1.5} className="text-[var(--brand-gold)]" />
                  </div>
                  <h3 className="font-semibold text-[var(--color-text-primary)]">{p.titulo}</h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                    {p.descripcion}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Proceso de verificación */}
      <section className="py-16 bg-[var(--color-surface-2)]">
        <div className="max-w-article mx-auto px-4 md:px-6">
          <h2 className="font-display font-bold text-3xl text-[var(--color-text-primary)] mb-6">
            Cómo verificamos la información
          </h2>
          <div className="article-body space-y-4">
            <p>
              Antes de publicar una noticia, nuestro equipo verifica que la información provenga de al menos
              una fuente primaria (organismo oficial, publicación científica, comunicado institucional o entrevista
              directa). Cuando es relevante, contrastamos con una segunda fuente independiente.
            </p>
            <p>
              Para artículos médicos en profundidad, el contenido es revisado por un especialista del{' '}
              <Link href="/consejo-medico" className="text-[var(--brand-electric)] hover:underline">
                Consejo Médico Editorial
              </Link>{' '}
              antes de su publicación. El nombre del médico revisor aparecerá visible en el artículo en cuanto
              integremos esa funcionalidad técnica.
            </p>
            <p>
              Las opiniones expresadas en columnas y entrevistas son responsabilidad de sus autores y no
              representan necesariamente la postura editorial de Reporte Médico.
            </p>
          </div>
        </div>
      </section>

      {/* Fuentes */}
      <section className="py-16 bg-[var(--color-surface)]">
        <div className="max-w-article mx-auto px-4 md:px-6">
          <h2 className="font-display font-bold text-3xl text-[var(--color-text-primary)] mb-6">
            Fuentes que utilizamos
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Estas son las principales fuentes de referencia que consultamos al elaborar nuestros contenidos:
          </p>
          <ul className="space-y-3">
            {fuentes.map((f) => (
              <li
                key={f.nombre}
                className="flex items-start gap-3 text-[var(--color-text-secondary)]"
              >
                <Users size={18} strokeWidth={1.5} className="text-[var(--brand-electric)] flex-shrink-0 mt-0.5" />
                {f.url ? (
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--brand-electric)] hover:underline"
                  >
                    {f.nombre}
                  </a>
                ) : (
                  <span>{f.nombre}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Correcciones y contacto */}
      <section className="py-16 bg-[var(--brand-navy)]">
        <div className="max-w-article mx-auto px-4 md:px-6 text-white">
          <h2 className="font-display font-bold text-3xl mb-6">¿Detectaste un error?</h2>
          <p className="text-white/80 leading-relaxed mb-6">
            Si encuentras información incorrecta, imprecisa o desactualizada en cualquiera de nuestros contenidos,
            te agradecemos que nos lo informes. Revisaremos el caso y, si procede, corregiremos el artículo de
            forma transparente, indicando la fecha de la actualización.
          </p>
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-5 py-4">
            <Mail size={22} strokeWidth={1.5} className="text-[var(--brand-gold)]" />
            <a
              href="mailto:info@reportemedico.com?subject=Correcci%C3%B3n%20editorial"
              className="text-white hover:text-[var(--brand-gold)]"
            >
              info@reportemedico.com
            </a>
          </div>
          <p className="text-xs text-white/40 mt-6">
            Última actualización de esta política: {new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long' })}
          </p>
        </div>
      </section>
    </main>
  )
}
