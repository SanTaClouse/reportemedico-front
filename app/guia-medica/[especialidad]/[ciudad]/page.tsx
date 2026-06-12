import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getSpecialtyBySlug, getCityBySlugPublic, getPublicDoctors, getIndexableCombinations,
} from '@/lib/api-guia'
import ProgrammaticListing from '@/components/guia/ProgrammaticListing'

export const revalidate = 3600
export const dynamicParams = true

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportemedico.com'

interface Props {
  params: { especialidad: string; ciudad: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let specialty
  let city
  let doctors
  try {
    ;[specialty, city, doctors] = await Promise.all([
      getSpecialtyBySlug(params.especialidad),
      getCityBySlugPublic(params.ciudad),
      getPublicDoctors({ specialty: params.especialidad, city: params.ciudad }),
    ])
  } catch {
    notFound()
  }
  // 🚫 P7 — REGLA INVIOLABLE: el 404 se decide acá — evita soft-404 con status 200
  if (!doctors.length) notFound()

  // La búsqueda real: "cardiólogo en santo domingo" (03 §1)
  const title = `${specialty.name} en ${city.name} — Guía Médica`
  const description = `${doctors.length} especialista${doctors.length === 1 ? '' : 's'} en ${specialty.name} verificados en ${city.name}. Filtrá por seguro (ARS), clínica y ubicación. Guía Médica de Reporte Médico.`
  const url = `${SITE_URL}/guia-medica/${params.especialidad}/${params.ciudad}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${title} | Reporte Médico`, description, url, type: 'website' },
    twitter: { card: 'summary', title, description },
  }
}

export default async function EspecialidadCiudadPage({ params }: Props) {
  let specialty
  let city
  let doctors
  try {
    ;[specialty, city, doctors] = await Promise.all([
      getSpecialtyBySlug(params.especialidad),
      getCityBySlugPublic(params.ciudad),
      getPublicDoctors({ specialty: params.especialidad, city: params.ciudad }),
    ])
  } catch {
    notFound()
  }

  // 🚫 UMBRAL P7 — REGLA INVIOLABLE: combinación con 0 médicos → 404,
  // sin placeholder ni "próximamente" (03 §1)
  if (!doctors.length) notFound()

  const combos = await getIndexableCombinations().catch(() => ({ pairs: [], specialties: [], cities: [] as { slug: string; name: string }[], clinics: [] }))
  const cityNames = new Map(combos.cities.map((c) => [c.slug, c.name]))
  const chips = combos.pairs
    .filter((p) => p.specialtySlug === params.especialidad && p.citySlug !== params.ciudad)
    .map((p) => ({
      href: `/guia-medica/${p.specialtySlug}/${p.citySlug}`,
      label: `${specialty.name} en ${cityNames.get(p.citySlug) ?? p.citySlug}`,
    }))

  const clinicNames = [...new Set(doctors.flatMap((d) => d.clinics.filter((c) => c.city.slug === params.ciudad).map((c) => c.name)))].slice(0, 5)
  const insuranceNames = [...new Set(doctors.flatMap((d) => d.insurances.map((i) => i.name)))].slice(0, 6)
  const intro = [
    `${doctors.length} especialista${doctors.length === 1 ? '' : 's'} en ${specialty.name} en ${city.name}.`,
    clinicNames.length ? `Atienden en ${clinicNames.join(', ')}.` : '',
    insuranceNames.length ? `Aceptan ${insuranceNames.join(', ')}.` : '',
    'Contacto directo por WhatsApp, sin intermediarios.',
  ].filter(Boolean).join(' ')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${specialty.name} en ${city.name}`,
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
      { '@type': 'ListItem', position: 3, name: city.name, item: `${SITE_URL}/guia-medica/${specialty.slug}/${city.slug}` },
    ],
  }

  return (
    <div className="max-w-site mx-auto px-4 md:px-6 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <nav aria-label="Ruta de navegación" className="text-xs text-[var(--color-text-muted)] mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/guia-medica" className="hover:text-[var(--color-primary)]">Guía Médica</Link>
        <span>/</span>
        <Link href={`/guia-medica/${specialty.slug}`} className="hover:text-[var(--color-primary)]">{specialty.name}</Link>
        <span>/</span>
        <span className="text-[var(--color-text-secondary)]">{city.name}</span>
      </nav>

      <h1 className="font-display font-bold text-2xl md:text-3xl text-[var(--color-text-primary)] mb-3">
        {specialty.name} en {city.name}
      </h1>

      <ProgrammaticListing doctors={doctors} intro={intro} chips={chips} chipsTitle="En otras ciudades" />
    </div>
  )
}
