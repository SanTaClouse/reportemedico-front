import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, Monitor, MapPin, ExternalLink, Languages, Clock, ArrowDown } from 'lucide-react'
import { getDoctorBySlug, getSpecialtyArticles, type SpecialtyArticle } from '@/lib/api-guia'
import { cldUrl } from '@/lib/cloudinary'
import { formatDate } from '@/lib/utils'
import ProfileCta from '@/components/guia/ProfileCta'
import ClinicsMap from '@/components/guia/ClinicsMap'
import InsuranceChips from '@/components/guia/InsuranceChips'
import ShareProfile from '@/components/guia/ShareProfile'
import DoctorCard from '@/components/guia/DoctorCard'

export const revalidate = 3600
export const dynamicParams = true

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportemedico.com'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let doctor
  try {
    doctor = await getDoctorBySlug(params.slug)
  } catch {
    // DRAFT/PENDING/INACTIVE o inexistente → 404 real desde metadata (evita soft-404)
    notFound()
  }
  const fullName = `${doctor.title ?? ''} ${doctor.firstName} ${doctor.lastName}`.trim()
  const specialty = doctor.specialties[0]?.specialty.name ?? 'Especialista'
  const city = doctor.clinics[0]?.clinic.city?.name
  const clinics = doctor.clinics.map((c) => c.clinic.name).join(', ')
  const insurances = doctor.insurances.slice(0, 3).map((i) => i.insurance.name).join(', ')

  const title = city
    ? `${fullName} — ${specialty} en ${city}`
    : `${fullName} — ${specialty}`
  const description = [
    `${specialty}${city ? ` en ${city}` : ''}.`,
    clinics ? `Atiende en ${clinics}.` : '',
    insurances ? `Acepta ${insurances}.` : '',
    'Contacto directo por WhatsApp.',
  ].filter(Boolean).join(' ')

  const url = `${SITE_URL}/medico/${params.slug}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | Reporte Médico`,
      description,
      url,
      type: 'profile',
      ...(doctor.photoUrl ? { images: [{ url: cldUrl(doctor.photoUrl, { w: 1200, h: 630 }) }] } : {}),
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function MedicoPage({ params }: Props) {
  let doctor
  try {
    doctor = await getDoctorBySlug(params.slug)
  } catch {
    notFound() // DRAFT/PENDING/INACTIVE o inexistente → 404 (04 §2)
  }

  const fullName = `${doctor.title ?? ''} ${doctor.firstName} ${doctor.lastName}`.trim()
  const shortName = `${doctor.title ?? ''} ${doctor.lastName}`.trim()
  const principal = doctor.specialties[0]?.specialty
  const city = doctor.clinics[0]?.clinic.city
  const isFemale = doctor.title === 'Dra.'

  // Noticias de la especialidad (04 §1.8), excluyendo los artículos propios
  const ownArticleIds = new Set((doctor as unknown as { articles?: { id: string }[] }).articles?.map((a) => a.id) ?? [])
  const specialtyNews: SpecialtyArticle[] = principal
    ? (await getSpecialtyArticles(principal.slug, 6).catch(() => []))
        .filter((a) => !ownArticleIds.has(a.id))
        .slice(0, 4)
    : []
  const ownArticles = ((doctor as unknown as { articles?: SpecialtyArticle[] }).articles ?? [])

  const pins = doctor.clinics
    .filter((c) => c.clinic.latitude != null && c.clinic.longitude != null)
    .map((c) => ({
      latitude: c.clinic.latitude!,
      longitude: c.clinic.longitude!,
      label: c.clinic.name,
      sublabel: c.clinic.address,
    }))

  // ─── JSON-LD: Physician + BreadcrumbList (03 §3) ───
  const physicianJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name: fullName,
    ...(doctor.photoUrl ? { image: cldUrl(doctor.photoUrl, { w: 1200, h: 630 }) } : {}),
    ...(doctor.bio ? { description: doctor.bio.slice(0, 300) } : {}),
    medicalSpecialty: doctor.specialties
      .map((s) => s.specialty.schemaOrgValue)
      .filter(Boolean),
    address: doctor.clinics.map((c) => ({
      '@type': 'PostalAddress',
      streetAddress: c.clinic.address,
      addressLocality: c.clinic.city?.name,
      addressCountry: 'DO',
    })),
    ...(doctor.phonePublic ? { telephone: doctor.phonePublic } : {}),
    url: `${SITE_URL}/medico/${doctor.slug}`,
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Guía Médica', item: `${SITE_URL}/guia-medica` },
      ...(principal
        ? [{ '@type': 'ListItem', position: 2, name: principal.name, item: `${SITE_URL}/guia-medica/${principal.slug}` }]
        : []),
      { '@type': 'ListItem', position: principal ? 3 : 2, name: fullName, item: `${SITE_URL}/medico/${doctor.slug}` },
    ],
  }

  return (
    <div className="max-w-site mx-auto px-4 md:px-6 py-8 pb-24 lg:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(physicianJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* Breadcrumbs */}
      <nav aria-label="Ruta de navegación" className="text-xs text-[var(--color-text-muted)] mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/guia-medica" className="hover:text-[var(--color-primary)]">Guía Médica</Link>
        {principal && (
          <>
            <span>/</span>
            <Link href={`/guia-medica/${principal.slug}`} className="hover:text-[var(--color-primary)]">
              {principal.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-[var(--color-text-secondary)]">{fullName}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ─── Columna principal ─── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero */}
          <header className="flex gap-5 items-start">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden bg-[var(--color-primary,#001450)] border-2 border-[var(--color-accent,#F0B414)]/60 flex items-center justify-center shrink-0 relative">
              {doctor.photoUrl ? (
                <Image
                  src={cldUrl(doctor.photoUrl, { w: 400, h: 400 })}
                  alt={`${fullName}, ${principal?.name ?? 'médico'} en ${city?.name ?? 'República Dominicana'}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 112px, 144px"
                  priority
                />
              ) : (
                <span className="font-display text-4xl font-bold text-white" aria-hidden>
                  {doctor.firstName[0]}{doctor.lastName[0]}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-2xl md:text-3xl text-[var(--color-text-primary)] flex items-center gap-2 flex-wrap">
                {fullName}
                {doctor.isVerified && (
                  <span
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)] bg-[var(--color-primary-pale,#e8edf8)] px-2 py-0.5 rounded-full"
                    title="Exequátur verificado por Reporte Médico"
                  >
                    <BadgeCheck size={16} /> Verificado
                  </span>
                )}
              </h1>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {doctor.specialties.map((s) => (
                  <Link
                    key={s.specialty.id}
                    href={`/guia-medica/${s.specialty.slug}`}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-primary,#001450)] text-white hover:opacity-90 transition-opacity"
                  >
                    {s.specialty.name}
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-2.5 text-xs text-[var(--color-text-secondary)]">
                {doctor.languages.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Languages size={12} /> {doctor.languages.join(' · ')}
                  </span>
                )}
                {doctor.telehealth && (
                  <span className="inline-flex items-center gap-1 text-[var(--color-primary)] font-medium">
                    <Monitor size={12} /> Teleconsulta disponible
                  </span>
                )}
              </div>
            </div>
          </header>

          {/* Compartir el perfil (Instagram / WhatsApp / etc.) */}
          <ShareProfile url={`${SITE_URL}/medico/${doctor.slug}`} name={fullName} />

          {/* Seguros (criterio #1 del paciente — 04 §1.3) */}
          {doctor.insurances.length > 0 && (
            <section aria-labelledby="seguros">
              <h2 id="seguros" className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-3">
                Seguros que acepta
              </h2>
              <InsuranceChips
                insurances={doctor.insurances.map((i) => ({ slug: i.insurance.slug, name: i.insurance.name }))}
                initial={4}
              />
            </section>
          )}

          {/* Dónde atiende (04 §1.4) */}
          {doctor.clinics.length > 0 && (
            <section id="donde-atiende" aria-labelledby="donde">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 id="donde" className="font-display font-bold text-lg text-[var(--color-text-primary)]">
                  Dónde atiende
                </h2>
                {pins.length > 0 && (
                  <a href="#mapa" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline">
                    Ver en el mapa <ArrowDown size={13} strokeWidth={2.2} />
                  </a>
                )}
              </div>
              <div className="space-y-3">
                {doctor.clinics.map((c) => (
                  <div key={c.clinic.id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <Link
                          href={`/clinica/${c.clinic.slug}`}
                          className="font-semibold text-sm text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors"
                        >
                          {c.clinic.name}
                        </Link>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1">
                          <MapPin size={11} /> {c.clinic.address}, {c.clinic.city?.name}
                        </p>
                      </div>
                      {c.clinic.latitude != null && c.clinic.longitude != null && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${c.clinic.latitude},${c.clinic.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] border border-[var(--color-primary)]/30 rounded-lg hover:bg-[var(--color-primary-pale,#e8edf8)] transition-colors"
                        >
                          Cómo llegar <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Bio — contenido único SEO (04 §1.5) */}
          {doctor.bio && (
            <section aria-labelledby="sobre">
              <h2 id="sobre" className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-3">
                Sobre {isFemale ? 'la' : 'el'} {doctor.title ?? 'Dr(a).'} {doctor.lastName}
              </h2>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-line">
                {doctor.bio}
              </p>
            </section>
          )}

          {/* Video de presentación — premium (04 §1.6) */}
          {doctor.videoUrl && (
            <section aria-labelledby="video">
              <h2 id="video" className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-3">
                Video de presentación
              </h2>
              <VideoEmbed url={doctor.videoUrl} title={`Video de presentación de ${fullName}`} />
            </section>
          )}

          {/* Horarios de consulta — debajo del video (pedido del cliente) */}
          {doctor.clinics.some((c) => c.schedule) && (
            <section aria-labelledby="horarios">
              <h2 id="horarios" className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-3">
                Horarios de consulta
              </h2>
              <ul className="space-y-2">
                {doctor.clinics
                  .filter((c) => c.schedule)
                  .map((c) => (
                    <li key={c.clinic.id} className="flex items-start gap-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3.5">
                      <Clock size={16} strokeWidth={1.5} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{c.clinic.name}</p>
                        <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-line">{c.schedule}</p>
                      </div>
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {/* Ubicación / mapa — debajo del video; ancla #mapa desde "Dónde atiende" */}
          {pins.length > 0 && (
            <section id="mapa" aria-labelledby="mapa-h" className="scroll-mt-24">
              <h2 id="mapa-h" className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-3">
                Ubicación
              </h2>
              <ClinicsMap pins={pins} />
            </section>
          )}

          {/* Artículos del médico — premium (04 §1.7) */}
          {ownArticles.length > 0 && (
            <section aria-labelledby="articulos">
              <h2 id="articulos" className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-3">
                Artículos de {isFemale ? 'la' : 'el'} {doctor.title ?? 'Dr(a).'} {doctor.lastName}
              </h2>
              <ArticleGrid articles={ownArticles} basePath="/articulos" />
            </section>
          )}

          {/* Noticias de la especialidad (04 §1.8) */}
          {principal && specialtyNews.length > 0 && (
            <section aria-labelledby="noticias">
              <h2 id="noticias" className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-3">
                Noticias de {principal.name}
              </h2>
              <ArticleGrid articles={specialtyNews} basePath="/noticias" />
            </section>
          )}

          {/* Médicos relacionados (04 §1.9 — confirmado por el cliente) */}
          {doctor.related.length > 0 && (
            <section aria-labelledby="relacionados">
              <h2 id="relacionados" className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-3">
                Otros {principal?.name ? `especialistas en ${principal.name}` : 'médicos'} {city ? `en ${city.name}` : ''}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {doctor.related.map((rel) => (
                  <DoctorCard key={rel.id} doctor={rel} source="search-card" />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ─── Columna lateral (desktop): CTA sticky ─── */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 space-y-4">
            <p className="font-display font-bold text-base text-[var(--color-text-primary)]">
              Agendar con {shortName}
            </p>
            <ProfileCta
              doctorId={doctor.id}
              doctorLabel={shortName}
              phonePublic={doctor.phonePublic}
              phoneOffice={doctor.phoneOffice}
            />
            {doctor.clinics.length > 0 && (
              <div className="pt-3 border-t border-[var(--color-border)] space-y-1.5">
                {doctor.clinics.map((c) => (
                  <p key={c.clinic.id} className="text-xs text-[var(--color-text-muted)]">
                    <span className="font-medium text-[var(--color-text-secondary)]">{c.clinic.name}</span>
                    {c.schedule && <> · {c.schedule}</>}
                  </p>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile: barra CTA sticky inferior */}
      <div className="lg:hidden">
        <ProfileCta
          doctorId={doctor.id}
          doctorLabel={shortName}
          phonePublic={doctor.phonePublic}
          phoneOffice={doctor.phoneOffice}
        />
      </div>
    </div>
  )
}

// ─── Helpers de render ──────────────────────────────────────────────────────

function VideoEmbed({ url, title }: { url: string; title: string }) {
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/)
  if (youtubeMatch) {
    return (
      <div className="aspect-video rounded-xl overflow-hidden">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeMatch[1]}`}
          title={title}
          loading="lazy"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    )
  }
  return (
    <video src={url} controls preload="none" className="w-full rounded-xl" title={title} />
  )
}

function ArticleGrid({ articles, basePath }: { articles: SpecialtyArticle[]; basePath: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {articles.map((a) => (
        <Link
          key={a.id}
          href={`${a.type === 'NEWS' ? '/noticias' : '/articulos'}/${a.slug}`}
          className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden hover:shadow-md transition-shadow group"
        >
          {a.featuredImage && (
            <div className="relative h-32 w-full">
              <Image
                src={cldUrl(a.featuredImage, { w: 600, h: 320 })}
                alt={a.title}
                fill
                className="object-cover group-hover:scale-[1.02] transition-transform"
                sizes="(max-width: 640px) 100vw, 320px"
              />
            </div>
          )}
          <div className="p-3">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
              {a.title}
            </p>
            {a.publishedAt && (
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{formatDate(a.publishedAt)}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
