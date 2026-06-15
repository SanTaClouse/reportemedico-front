import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  getSpecialtyBySlug, getPublicDoctors, getIndexableCombinations, getSpecialtyArticles,
} from '@/lib/api-guia'
import { cldUrl } from '@/lib/cloudinary'
import { formatDate } from '@/lib/utils'
import ProgrammaticListing from '@/components/guia/ProgrammaticListing'

export const revalidate = 3600
export const dynamicParams = true

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportemedico.com'

interface Props {
  params: { especialidad: string }
}

export async function generateStaticParams() {
  // Solo lo liviano se pre-genera en build (03 §5)
  try {
    const { specialties } = await getIndexableCombinations()
    return specialties.map((s) => ({ especialidad: s.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let specialty
  let doctors
  try {
    ;[specialty, doctors] = await Promise.all([
      getSpecialtyBySlug(params.especialidad),
      getPublicDoctors({ specialty: params.especialidad }),
    ])
  } catch {
    notFound()
  }
  // 🚫 P7: el 404 se decide ACÁ (generateMetadata corre primero) — si solo lo
  // decidiera el body, Next ya habría enviado status 200 (soft-404)
  if (!doctors.length) notFound()

  const title = `${specialty.name} en República Dominicana — Guía Médica`
  const description = `${doctors.length} especialistas en ${specialty.name} verificados en República Dominicana. Filtra por seguro (ARS), clínica y ubicación. Guía Médica de Reporte Médico.`
  const url = `${SITE_URL}/guia-medica/${params.especialidad}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${title} | Reporte Médico`, description, url, type: 'website' },
    twitter: { card: 'summary', title, description },
  }
}

export default async function EspecialidadPage({ params }: Props) {
  let specialty
  let doctors
  try {
    ;[specialty, doctors] = await Promise.all([
      getSpecialtyBySlug(params.especialidad),
      getPublicDoctors({ specialty: params.especialidad }),
    ])
  } catch {
    notFound()
  }

  // 🚫 UMBRAL P7: especialidad sin médicos publicados → 404
  if (!doctors.length) notFound()

  const [combos, news] = await Promise.all([
    getIndexableCombinations().catch(() => ({ pairs: [], cities: [] as { slug: string; name: string }[], specialties: [], clinics: [] })),
    getSpecialtyArticles(params.especialidad, 4).catch(() => []),
  ])

  // Chips SOLO a combinaciones esp × ciudad indexables (P7)
  const cityNames = new Map(combos.cities.map((c) => [c.slug, c.name]))
  const chips = combos.pairs
    .filter((p) => p.specialtySlug === params.especialidad)
    .map((p) => ({
      href: `/guia-medica/${p.specialtySlug}/${p.citySlug}`,
      label: `${specialty.name} en ${cityNames.get(p.citySlug) ?? p.citySlug}`,
    }))

  const clinicNames = [...new Set(doctors.flatMap((d) => d.clinics.map((c) => c.name)))].slice(0, 5)
  const insuranceNames = [...new Set(doctors.flatMap((d) => d.insurances.map((i) => i.name)))].slice(0, 6)
  const intro = [
    `${doctors.length} especialista${doctors.length === 1 ? '' : 's'} en ${specialty.name} en República Dominicana.`,
    clinicNames.length ? `Atienden en ${clinicNames.join(', ')}.` : '',
    insuranceNames.length ? `Aceptan ${insuranceNames.join(', ')}.` : '',
    'Contacto directo por WhatsApp, sin intermediarios.',
  ].filter(Boolean).join(' ')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${specialty.name} en República Dominicana`,
    itemListElement: doctors.map((d, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${d.title ?? ''} ${d.firstName} ${d.lastName}`.trim(),
      url: `${SITE_URL}/medico/${d.slug}`,
    })),
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Guía Médica', item: `${SITE_URL}/guia-medica` },
      { '@type': 'ListItem', position: 2, name: specialty.name, item: `${SITE_URL}/guia-medica/${specialty.slug}` },
    ],
  }

  return (
    <div className="max-w-site mx-auto px-4 md:px-6 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <nav aria-label="Ruta de navegación" className="text-xs text-[var(--color-text-muted)] mb-6 flex items-center gap-2">
        <Link href="/guia-medica" className="hover:text-[var(--color-primary)]">Guía Médica</Link>
        <span>/</span>
        <span className="text-[var(--color-text-secondary)]">{specialty.name}</span>
      </nav>

      <h1 className="font-display font-bold text-2xl md:text-3xl text-[var(--color-text-primary)] mb-3">
        {specialty.name} en República Dominicana
      </h1>

      <ProgrammaticListing doctors={doctors} intro={intro} chips={chips} chipsTitle="Por ciudad" />

      {news.length > 0 && (
        <section className="mt-10" aria-labelledby="noticias-esp">
          <h2 id="noticias-esp" className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-3">
            Noticias de {specialty.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {news.map((a) => (
              <Link
                key={a.id}
                href={`${a.type === 'NEWS' ? '/noticias' : '/articulos'}/${a.slug}`}
                className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden hover:shadow-md transition-shadow group"
              >
                {a.featuredImage && (
                  <div className="relative h-28 w-full">
                    <Image
                      src={cldUrl(a.featuredImage, { w: 480, h: 260 })}
                      alt={a.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 240px"
                    />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs font-semibold text-[var(--color-text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                    {a.title}
                  </p>
                  {a.publishedAt && (
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{formatDate(a.publishedAt)}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
