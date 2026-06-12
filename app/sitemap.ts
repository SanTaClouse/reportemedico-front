import type { MetadataRoute } from 'next'
import { getNews, getMedicalArticles } from '@/lib/api'
import { getIndexableCombinations, getPublicDoctors } from '@/lib/api-guia'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportemedico.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [newsRes, medicalRes, combos, publishedDoctors] = await Promise.all([
    getNews(1).catch(() => ({ data: [] })),
    getMedicalArticles(1).catch(() => ({ data: [] })),
    // UMBRAL P7: el sitemap SOLO incluye combinaciones con ≥1 médico publicado.
    // getIndexableCombinations() es la única fuente de verdad (03 §1).
    getIndexableCombinations().catch(() => ({ specialties: [], cities: [], clinics: [], pairs: [] })),
    getPublicDoctors({}).catch(() => []),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, priority: 1.0, changeFrequency: 'daily' },
    { url: `${SITE_URL}/noticias`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${SITE_URL}/articulos`, priority: 0.9, changeFrequency: 'weekly' },
    { url: `${SITE_URL}/sobre-nosotros`, priority: 0.5, changeFrequency: 'monthly' },
    { url: `${SITE_URL}/ediciones`, priority: 0.5, changeFrequency: 'monthly' },
    { url: `${SITE_URL}/politica-editorial`, priority: 0.4, changeFrequency: 'yearly' },
  ]

  const newsRoutes: MetadataRoute.Sitemap = newsRes.data.map((a) => ({
    url: `${SITE_URL}/noticias/${a.slug}`,
    lastModified: a.updatedAt,
    priority: a.relevance === 1 ? 1.0 : a.relevance === 2 ? 0.8 : 0.6,
    changeFrequency: 'weekly',
  }))

  const medicalRoutes: MetadataRoute.Sitemap = medicalRes.data.map((a) => ({
    url: `${SITE_URL}/articulos/${a.slug}`,
    lastModified: a.updatedAt,
    priority: 0.7,
    changeFrequency: 'monthly',
  }))

  // ─── Guía Médica (V2) — solo entidades indexables según P7 ───

  const hasGuide = publishedDoctors.length > 0

  const guideRoutes: MetadataRoute.Sitemap = hasGuide
    ? [{ url: `${SITE_URL}/guia-medica`, priority: 0.9, changeFrequency: 'daily' as const }]
    : []

  const doctorRoutes: MetadataRoute.Sitemap = publishedDoctors.map((d) => ({
    url: `${SITE_URL}/medico/${d.slug}`,
    priority: 0.8,
    changeFrequency: 'weekly',
  }))

  const specialtyRoutes: MetadataRoute.Sitemap = combos.specialties.map((s) => ({
    url: `${SITE_URL}/guia-medica/${s.slug}`,
    priority: 0.7,
    changeFrequency: 'weekly',
  }))

  const cityRoutes: MetadataRoute.Sitemap = combos.cities.map((c) => ({
    url: `${SITE_URL}/guia-medica/ciudad/${c.slug}`,
    priority: 0.6,
    changeFrequency: 'weekly',
  }))

  // La búsqueda real: "cardiólogo en santo domingo" — la página más valiosa
  const pairRoutes: MetadataRoute.Sitemap = combos.pairs.map((p) => ({
    url: `${SITE_URL}/guia-medica/${p.specialtySlug}/${p.citySlug}`,
    priority: 0.8,
    changeFrequency: 'weekly',
  }))

  const clinicRoutes: MetadataRoute.Sitemap = combos.clinics.map((c) => ({
    url: `${SITE_URL}/clinica/${c.slug}`,
    priority: 0.6,
    changeFrequency: 'weekly',
  }))

  return [
    ...staticRoutes, ...newsRoutes, ...medicalRoutes,
    ...guideRoutes, ...doctorRoutes, ...specialtyRoutes, ...cityRoutes, ...pairRoutes, ...clinicRoutes,
  ]
}
