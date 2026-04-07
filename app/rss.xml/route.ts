import { getNews, getMedicalArticles } from '@/lib/api'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportemedico.com'

// Revalidar cada 10 minutos para que Google News descubra contenido nuevo rápidamente
export const revalidate = 600

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function cdata(value: string): string {
  // Cierra cualquier ']]>' interno para no romper el CDATA
  return `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

export async function GET() {
  const [newsRes, medicalRes] = await Promise.all([
    getNews(1, 50, 'publishedAt_desc').catch(() => ({ data: [] as any[] })),
    getMedicalArticles(1, 20).catch(() => ({ data: [] as any[] })),
  ])

  const items = [
    ...newsRes.data.map((a) => ({ ...a, _section: 'noticias' as const })),
    ...medicalRes.data.map((a) => ({ ...a, _section: 'articulos' as const })),
  ]
    .filter((a) => a.publishedAt || a.createdAt)
    .sort((a, b) => {
      const da = new Date(a.publishedAt || a.createdAt).getTime()
      const db = new Date(b.publishedAt || b.createdAt).getTime()
      return db - da
    })
    .slice(0, 50)

  const lastBuildDate = items[0]
    ? new Date(items[0].publishedAt || items[0].createdAt).toUTCString()
    : new Date().toUTCString()

  const xmlItems = items
    .map((a) => {
      const url = `${SITE_URL}/${a._section}/${a.slug}`
      const pubDate = new Date(a.publishedAt || a.createdAt).toUTCString()
      const author = a.authorName?.trim() || 'Redacción Reporte Médico'
      const categories = (a.tags ?? [])
        .map(({ tag }: any) => `      <category>${escapeXml(tag.name)}</category>`)
        .join('\n')
      const image = a.featuredImage
        ? `      <enclosure url="${escapeXml(a.featuredImage)}" type="image/jpeg" />`
        : ''

      return `    <item>
      <title>${cdata(a.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${cdata(author)}</dc:creator>
      <description>${cdata(a.excerpt || '')}</description>
${image}
${categories}
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Reporte Médico — Noticias de salud en República Dominicana</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Últimas noticias y artículos médicos de Reporte Médico, plataforma líder en salud de República Dominicana.</description>
    <language>es-DO</language>
    <copyright>© ${new Date().getFullYear()} Reporte Médico</copyright>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${xmlItems}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
    },
  })
}
