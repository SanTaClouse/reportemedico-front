import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Phone, ExternalLink } from 'lucide-react'
import { getClinicBySlugPublic, getPublicDoctors, type PublicDoctorCard } from '@/lib/api-guia'
import ClinicsMap from '@/components/guia/ClinicsMap'
import DoctorCard from '@/components/guia/DoctorCard'

export const revalidate = 3600
export const dynamicParams = true

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportemedico.com'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let clinic
  let doctors
  try {
    ;[clinic, doctors] = await Promise.all([
      getClinicBySlugPublic(params.slug),
      getPublicDoctors({ clinic: params.slug }),
    ])
  } catch {
    notFound()
  }
  // 🚫 P7: clínica sin médicos publicados → 404 real (no soft-404)
  if (!doctors.length) notFound()

  const topSpecialties = [...new Set(doctors.flatMap((d) => d.specialties.map((s) => s.name)))].slice(0, 3)
  const title = `${clinic.name} — Especialistas y contacto`
  const description = `Médicos que atienden en ${clinic.name}, ${clinic.city?.name}: ${topSpecialties.join(', ')}. Direcciones, tandas y contacto directo por WhatsApp.`
  const url = `${SITE_URL}/clinica/${params.slug}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${title} | Reporte Médico`, description, url, type: 'website' },
    twitter: { card: 'summary', title, description },
  }
}

export default async function ClinicaPage({ params }: Props) {
  let clinic
  let doctors: PublicDoctorCard[]
  try {
    ;[clinic, doctors] = await Promise.all([
      getClinicBySlugPublic(params.slug),
      getPublicDoctors({ clinic: params.slug }),
    ])
  } catch {
    notFound()
  }

  // 🚫 UMBRAL P7: clínica con 0 médicos publicados → 404, fuera del sitemap (04 §4)
  if (!doctors.length) notFound()

  // Agrupar por especialidad principal (04 §4.2)
  const bySpecialty = new Map<string, { name: string; doctors: PublicDoctorCard[] }>()
  for (const doc of doctors) {
    const sp = doc.specialties[0] ?? { slug: 'general', name: 'Medicina General' }
    if (!bySpecialty.has(sp.slug)) bySpecialty.set(sp.slug, { name: sp.name, doctors: [] })
    bySpecialty.get(sp.slug)!.doctors.push(doc)
  }

  const hasCoords = clinic.latitude != null && clinic.longitude != null

  const clinicJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    name: clinic.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: clinic.address,
      addressLocality: clinic.city?.name,
      addressCountry: 'DO',
    },
    ...(hasCoords
      ? { geo: { '@type': 'GeoCoordinates', latitude: clinic.latitude, longitude: clinic.longitude } }
      : {}),
    ...(clinic.phone ? { telephone: clinic.phone } : {}),
    url: `${SITE_URL}/clinica/${clinic.slug}`,
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Guía Médica', item: `${SITE_URL}/guia-medica` },
      ...(clinic.city
        ? [{ '@type': 'ListItem', position: 2, name: clinic.city.name, item: `${SITE_URL}/guia-medica/ciudad/${clinic.city.slug}` }]
        : []),
      { '@type': 'ListItem', position: clinic.city ? 3 : 2, name: clinic.name, item: `${SITE_URL}/clinica/${clinic.slug}` },
    ],
  }
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: doctors.map((d, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${d.title ?? ''} ${d.firstName} ${d.lastName}`.trim(),
      url: `${SITE_URL}/medico/${d.slug}`,
    })),
  }

  return (
    <div className="max-w-site mx-auto px-4 md:px-6 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(clinicJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      <nav aria-label="Ruta de navegación" className="text-xs text-[var(--color-text-muted)] mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/guia-medica" className="hover:text-[var(--color-primary)]">Guía Médica</Link>
        {clinic.city && (
          <>
            <span>/</span>
            <Link href={`/guia-medica/ciudad/${clinic.city.slug}`} className="hover:text-[var(--color-primary)]">
              {clinic.city.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-[var(--color-text-secondary)]">{clinic.name}</span>
      </nav>

      {/* Hero */}
      <header className="mb-8">
        <h1 className="font-display font-bold text-2xl md:text-3xl text-[var(--color-text-primary)] mb-2">
          {clinic.name}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-text-secondary)]">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} /> {clinic.address}, {clinic.city?.name}
          </span>
          {clinic.phone && (
            <a href={`tel:${clinic.phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-[var(--color-primary)]">
              <Phone size={14} /> {clinic.phone}
            </a>
          )}
          {hasCoords && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${clinic.latitude},${clinic.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[var(--color-primary)] font-medium hover:underline"
            >
              Cómo llegar <ExternalLink size={12} />
            </a>
          )}
        </div>
      </header>

      {hasCoords && (
        <div className="mb-8">
          <ClinicsMap pins={[{ latitude: clinic.latitude!, longitude: clinic.longitude!, label: clinic.name, sublabel: clinic.address }]} />
        </div>
      )}

      {/* Médicos agrupados por especialidad */}
      <h2 className="font-display font-bold text-xl text-[var(--color-text-primary)] mb-5">
        Especialistas que atienden en {clinic.name}
      </h2>
      <div className="space-y-7">
        {[...bySpecialty.entries()].map(([slug, group]) => (
          <section key={slug} aria-labelledby={`esp-${slug}`}>
            <h3 id={`esp-${slug}`} className="font-semibold text-sm uppercase tracking-wide text-[var(--color-text-muted)] mb-3">
              <Link href={`/guia-medica/${slug}`} className="hover:text-[var(--color-primary)]">
                {group.name}
              </Link>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.doctors.map((doc) => (
                <DoctorCard key={doc.id} doctor={doc} source="clinic-page" />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
