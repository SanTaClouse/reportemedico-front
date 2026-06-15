import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Stethoscope, X } from 'lucide-react'
import {
  getSpecialties, getCities, getInsurances, getIndexableCombinations,
  searchDoctors, getPublicDoctors, type SearchFilters,
} from '@/lib/api-guia'
import { getNews } from '@/lib/api'
import { cldUrl } from '@/lib/cloudinary'
import { formatDate } from '@/lib/utils'
import GuiaSearchForm from '@/components/guia/GuiaSearchForm'
import ResultsToggle from '@/components/guia/ResultsToggle'
import DoctorCard from '@/components/guia/DoctorCard'
import ClinicsMap from '@/components/guia/ClinicsMap'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportemedico.com'
const PAGE_SIZE = 20

interface Props {
  searchParams: SearchFilters
}

const FILTER_KEYS = ['seguro', 'especialidad', 'ciudad', 'q', 'modalidad', 'lat', 'lng', 'page'] as const

function hasFilters(searchParams: SearchFilters) {
  return FILTER_KEYS.some((k) => Boolean(searchParams[k]))
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  // Resultados con filtros: noindex — el orgánico entra por las URLs limpias (03 §1)
  if (hasFilters(searchParams)) {
    return {
      title: 'Buscar médicos — Guía Médica',
      robots: { index: false, follow: true },
    }
  }
  const title = 'Guía Médica de República Dominicana'
  const description =
    'Encuentra médicos especialistas en República Dominicana: filtra por tu seguro (ARS), especialidad y ciudad. Perfiles verificados con contacto directo por WhatsApp.'
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/guia-medica` },
    openGraph: { title: `${title} | Reporte Médico`, description, url: `${SITE_URL}/guia-medica`, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function GuiaMedicaPage({ searchParams }: Props) {
  const [specialties, cities, insurances] = await Promise.all([
    getSpecialties().catch(() => []),
    getCities().catch(() => []),
    getInsurances().catch(() => []),
  ])

  if (hasFilters(searchParams)) {
    return (
      <ResultsView
        searchParams={searchParams}
        specialties={specialties}
        cities={cities}
        insurances={insurances}
      />
    )
  }
  return <HomeView specialties={specialties} cities={cities} insurances={insurances} />
}

// ─── Home de la guía (05 §1) ────────────────────────────────────────────────

async function HomeView({
  specialties, cities, insurances,
}: {
  specialties: Awaited<ReturnType<typeof getSpecialties>>
  cities: Awaited<ReturnType<typeof getCities>>
  insurances: Awaited<ReturnType<typeof getInsurances>>
}) {
  const [combos, allDoctors, newsRes] = await Promise.all([
    getIndexableCombinations().catch(() => ({ specialties: [], cities: [], clinics: [], pairs: [] })),
    getPublicDoctors({}).catch(() => []),
    getNews(1, 4).catch(() => ({ data: [] })),
  ])

  // Pines del mapa general: clínicas con médicos publicados (P4/P7)
  const pins = allDoctors
    .flatMap((d) => d.clinics)
    .filter((c, i, arr) => arr.findIndex((x) => x.slug === c.slug) === i)
    .map((c) => ({ latitude: c.latitude, longitude: c.longitude, label: c.name, sublabel: c.address }))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Guía Médica de Reporte Médico',
    url: `${SITE_URL}/guia-medica`,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/guia-medica?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <div className="max-w-site mx-auto px-4 md:px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero de búsqueda */}
      <header className="max-w-3xl mx-auto text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary,#001450)] flex items-center justify-center mx-auto mb-4">
          <Stethoscope size={26} className="text-[var(--color-accent,#F0B414)]" strokeWidth={1.5} />
        </div>
        <h1 className="font-display font-bold text-3xl md:text-4xl text-[var(--color-text-primary)] mb-2">
          Guía Médica de República Dominicana
        </h1>
        <p className="text-sm md:text-base text-[var(--color-text-secondary)] mb-6">
          Encuentra tu especialista por seguro, especialidad y ciudad — contacto directo por WhatsApp.
        </p>
        <div className="text-left bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm">
          <GuiaSearchForm insurances={insurances} specialties={specialties} cities={cities} />
        </div>
      </header>

      {/* Chips de acceso rápido — SOLO especialidades indexables (P7) */}
      {combos.specialties.length > 0 && (
        <section className="max-w-3xl mx-auto mb-10" aria-label="Especialidades disponibles">
          <div className="flex flex-wrap justify-center gap-1.5">
            {combos.specialties.map((s) => (
              <Link
                key={s.slug}
                href={`/guia-medica/${s.slug}`}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] transition-colors"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Mapa general (lazy, no bloquea LCP) */}
      {pins.length > 0 && (
        <section className="mb-10" aria-label="Mapa de clínicas">
          <h2 className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-3">
            Clínicas con especialistas en la guía
          </h2>
          <ClinicsMap pins={pins} />
        </section>
      )}

      {/* Bloque editorial: interlinking con las noticias V1 (05 §1.5) */}
      {newsRes.data.length > 0 && (
        <section aria-label="Últimas noticias de salud">
          <h2 className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-3">
            Últimas noticias de salud
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {newsRes.data.map((a) => (
              <Link
                key={a.id}
                href={`/noticias/${a.slug}`}
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

// ─── Resultados URL-driven (05 §2) ──────────────────────────────────────────

async function ResultsView({
  searchParams, specialties, cities, insurances,
}: {
  searchParams: SearchFilters
  specialties: Awaited<ReturnType<typeof getSpecialties>>
  cities: Awaited<ReturnType<typeof getCities>>
  insurances: Awaited<ReturnType<typeof getInsurances>>
}) {
  const results = await searchDoctors(searchParams).catch(() => ({
    items: [], total: 0, page: 1, limit: PAGE_SIZE,
  }))
  const { items, total, page, limit } = results
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const usingGeo = Boolean(searchParams.lat && searchParams.lng)

  // Chips activos removibles (05 §2)
  const activeChips: { key: keyof SearchFilters; label: string }[] = []
  const findName = (list: { slug: string; name: string }[], slug?: string) =>
    list.find((x) => x.slug === slug)?.name ?? slug ?? ''
  if (searchParams.seguro) activeChips.push({ key: 'seguro', label: `🛡️ ${findName(insurances, searchParams.seguro)}` })
  if (searchParams.especialidad) activeChips.push({ key: 'especialidad', label: findName(specialties, searchParams.especialidad) })
  if (searchParams.ciudad) activeChips.push({ key: 'ciudad', label: findName(cities, searchParams.ciudad) })
  if (searchParams.modalidad) activeChips.push({ key: 'modalidad', label: '💻 Teleconsulta' })
  if (searchParams.q) activeChips.push({ key: 'q', label: `"${searchParams.q}"` })
  if (usingGeo) activeChips.push({ key: 'lat', label: '📍 Cerca de mí' })

  const buildUrl = (omit: (keyof SearchFilters)[] = [], extra: Record<string, string> = {}) => {
    const params = new URLSearchParams()
    for (const key of FILTER_KEYS) {
      if (key === 'page') continue
      if (omit.includes(key)) continue
      // lat y lng van juntos
      if (omit.includes('lat') && (key === 'lat' || key === 'lng')) continue
      const value = searchParams[key]
      if (value) params.set(key, value)
    }
    for (const [k, v] of Object.entries(extra)) params.set(k, v)
    const qs = params.toString()
    return `/guia-medica${qs ? `?${qs}` : ''}`
  }

  // Pines del mapa: clínicas de los resultados visibles (05 §5)
  const pins = items
    .flatMap((d) => d.clinics)
    .filter((c, i, arr) => arr.findIndex((x) => x.slug === c.slug) === i)
    .map((c) => ({ latitude: c.latitude, longitude: c.longitude, label: c.name, sublabel: c.address }))

  return (
    <div className="max-w-site mx-auto px-4 md:px-6 py-8">
      <h1 className="font-display font-bold text-xl md:text-2xl text-[var(--color-text-primary)] mb-4">
        {total} médico{total === 1 ? '' : 's'} encontrado{total === 1 ? '' : 's'}
      </h1>

      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 mb-4">
        <GuiaSearchForm
          insurances={insurances}
          specialties={specialties}
          cities={cities}
          current={searchParams}
          compact
        />
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5" aria-label="Filtros activos">
          {activeChips.map((chip) => (
            <Link
              key={chip.key}
              href={buildUrl([chip.key])}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-primary,#001450)] text-white hover:opacity-90 transition-opacity"
            >
              {chip.label} <X size={11} />
            </Link>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyResults searchParams={searchParams} buildUrl={buildUrl} specialties={specialties} insurances={insurances} />
      ) : (
        <ResultsToggle
          list={
            <div className="space-y-3">
              {items.map((doc) => (
                <DoctorCard
                  key={doc.id}
                  doctor={doc}
                  source="search-card"
                  highlightInsurance={searchParams.seguro}
                  distanceKm={doc.distanceKm}
                />
              ))}
              {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-2 pt-4" aria-label="Paginación">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={buildUrl([], p > 1 ? { page: String(p) } : {})}
                      className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center ${
                        p === page
                          ? 'bg-[var(--color-primary,#001450)] text-white'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
                      }`}
                    >
                      {p}
                    </Link>
                  ))}
                </nav>
              )}
            </div>
          }
          map={<ClinicsMap pins={pins} />}
        />
      )}
    </div>
  )
}

// ─── Resultados vacíos: nunca página muerta (05 §7) ─────────────────────────

function EmptyResults({
  searchParams, buildUrl, specialties, insurances,
}: {
  searchParams: SearchFilters
  buildUrl: (omit?: (keyof SearchFilters)[], extra?: Record<string, string>) => string
  specialties: { slug: string; name: string }[]
  insurances: { slug: string; name: string }[]
}) {
  const especialidadName = specialties.find((s) => s.slug === searchParams.especialidad)?.name
  const seguroName = insurances.find((i) => i.slug === searchParams.seguro)?.name

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-10 text-center">
      <p className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-2">
        No encontramos médicos con estos filtros
      </p>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        La guía crece todos los días — probá ajustando la búsqueda:
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {searchParams.seguro && (
          <Link
            href={buildUrl(['seguro'])}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary-pale,#e8edf8)] transition-colors"
          >
            Buscar sin el seguro {seguroName}
          </Link>
        )}
        {searchParams.ciudad && searchParams.especialidad && (
          <Link
            href={buildUrl(['ciudad'])}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary-pale,#e8edf8)] transition-colors"
          >
            Ver {especialidadName} en todas las ciudades
          </Link>
        )}
        {searchParams.q && (
          <Link
            href={buildUrl(['q'])}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary-pale,#e8edf8)] transition-colors"
          >
            Quitar &ldquo;{searchParams.q}&rdquo;
          </Link>
        )}
        <Link
          href="/guia-medica"
          className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40 transition-colors"
        >
          Empezar de nuevo
        </Link>
      </div>
    </div>
  )
}
