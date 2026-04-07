import type { MetadataRoute } from 'next'
import { getNews, getMedicalArticles } from '@/lib/api'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportemedico.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [newsRes, medicalRes] = await Promise.all([
    getNews(1).catch(() => ({ data: [] })),
    getMedicalArticles(1).catch(() => ({ data: [] })),
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

  return [...staticRoutes, ...newsRoutes, ...medicalRoutes]
}
