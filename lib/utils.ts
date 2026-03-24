const TZ = 'America/Santo_Domingo'

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  })
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TZ,
  })
}

export function readingTime(html: string | undefined | null): number {
  const text = (html ?? '').replace(/<[^>]*>/g, '')
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trimEnd() + '...'
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

/** Redirige imágenes de image.isu.pub a través del proxy local para evitar el 403 de Issuu */
export function issuuCoverUrl(src: string): string {
  if (src.startsWith('https://image.isu.pub/')) {
    return `/api/image-proxy?url=${encodeURIComponent(src)}`
  }
  return src
}

/** Convierte la URL de embed de Issuu a la URL directa para el botón "abrir" */
export function embedUrlToDirectUrl(embedUrl: string): string {
  try {
    const url = new URL(embedUrl)
    const d = url.searchParams.get('d')
    const u = url.searchParams.get('u')
    if (d && u) return `https://issuu.com/${u}/docs/${d}`
  } catch {
    // ignorar error de parseo
  }
  return embedUrl
}
