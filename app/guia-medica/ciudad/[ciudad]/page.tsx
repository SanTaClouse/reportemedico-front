import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCityBySlugPublic, getPublicDoctors, getIndexableCombinations } from '@/lib/api-guia'
import ProgrammaticListing from '@/components/guia/ProgrammaticListing'

export const revalidate = 3600
export const dynamicParams = true

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportemedico.com'

interface Props {
  params: { ciudad: string }
}

export async function generateStaticParams() {
  try {
    const { cities } = await getIndexableCombinations()
    return cities.map((c) => ({ ciudad: c.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let city
  let doctors
  try {
    ;[city, doctors] = await Promise.all([
      getCityBySlugPublic(params.ciudad),
      getPublicDoctors({ city: params.ciudad }),
    ])
  } catch {
    notFound()
  }
  // 🚫 P7: el 404 se decide acá — evita soft-404 con status 200
  if (!doctors.length) notFound()

  const title = `Médicos en ${city.name} — Guía Médica`
  const description = `${doctors.length} médicos especialistas verificados en ${city.name}. Filtrá por seguro (ARS), especialidad y clínica. Guía Médica de Reporte Médico.`
  const url = `${SITE_URL}/guia-medica/ciudad/${params.ciudad}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${title} | Reporte Médico`, description, url, type: 'website' },
    twitter: { card: 'summary', title, description },
  }
}

export default async function CiudadPage({ params }: Props) {
  let city
  let doctors
  try {
    ;[city, doctors] = await Promise.all([
      getCityBySlugPublic(params.ciudad),
      getPublicDoctors({ city: params.ciudad }),
    ])
  } catch {
    notFound()
  }

  // 🚫 UMBRAL P7: ciudad sin médicos publicados → 404
  if (!doctors.length) notFound()

  const combos = await getIndexableCombinations().catch(() => ({ pairs: [], specialties: [] as { slug: string; name: string }[], cities: [], clinics: [] }))
  const specialtyNames = new Map(combos.specialties.map((s) => [s.slug, s.name]))
  const chips = combos.pairs
    .filter((p) => p.citySlug === params.ciudad)
    .map((p) => ({
      href: `/guia-medica/${p.specialtySlug}/${p.citySlug}`,
      label: specialtyNames.get(p.specialtySlug) ?? p.specialtySlug,
    }))

  const clinicNames = [...new Set(doctors.flatMap((d) => d.clinics.filter((c) => c.city.slug === params.ciudad).map((c) => c.name)))].slice(0, 5)
  const intro = [
    `${doctors.length} médico${doctors.length === 1 ? '' : 's'} especialista${doctors.length === 1 ? '' : 's'} en ${city.name}.`,
    clinicNames.length ? `Atienden en ${clinicNames.join(', ')}.` : '',
    'Contacto directo por WhatsApp, sin intermediarios.',
  ].filter(Boolean).join(' ')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Médicos en ${city.name}`,
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
      { '@type': 'ListItem', position: 2, name: city.name, item: `${SITE_URL}/guia-medica/ciudad/${city.slug}` },
    ],
  }

  return (
    <div className="max-w-site mx-auto px-4 md:px-6 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <nav aria-label="Ruta de navegación" className="text-xs text-[var(--color-text-muted)] mb-6 flex items-center gap-2">
        <Link href="/guia-medica" className="hover:text-[var(--color-primary)]">Guía Médica</Link>
        <span>/</span>
        <span className="text-[var(--color-text-secondary)]">{city.name}</span>
      </nav>

      <h1 className="font-display font-bold text-2xl md:text-3xl text-[var(--color-text-primary)] mb-3">
        Médicos en {city.name}
      </h1>

      <ProgrammaticListing doctors={doctors} intro={intro} chips={chips} chipsTitle="Por especialidad" />
    </div>
  )
}
