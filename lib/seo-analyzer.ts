const STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'de', 'del', 'en', 'un', 'una', 'unos', 'unas',
  'y', 'o', 'que', 'se', 'su', 'sus', 'por', 'para', 'con', 'sin', 'al',
  'le', 'lo', 'me', 'mi', 'nos', 'es', 'son', 'fue', 'ser', 'han', 'ha',
  'hay', 'pero', 'si', 'no', 'mas', 'ya', 'este', 'esta', 'estos', 'estas',
  'ese', 'esa', 'como', 'cuando', 'donde', 'quien', 'cual', 'cuales',
  'sobre', 'entre', 'hasta', 'desde', 'durante', 'ante', 'bajo', 'segun',
  'tras', 'tambien', 'muy', 'bien', 'aqui', 'alli', 'asi', 'todo', 'toda',
  'todos', 'todas', 'otro', 'otra', 'otros', 'otras', 'nuevo', 'nueva',
])

const BAD_PHRASES = [
  'todo lo que', 'lo que debes saber', 'cosas que', 'importante',
  'gran', 'mejor', 'avances en', 'todo sobre',
]

function extractKeywords(text: string): string[] {
  if (!text) return []
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
}

function overlap(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0
  const setB = new Set(b)
  return a.filter((w) => setB.has(w)).length / a.length
}

export interface SeoSignal {
  label: string
  status: 'ok' | 'warn' | 'error'
  hint: string
}

export interface SeoAnalysis {
  score: number
  signals: SeoSignal[]
  topKeywords: string[]
}

export function analyzeSeo({
  title,
  excerpt,
  content,
  metaTitle,
  metaDescription,
}: {
  title: string
  excerpt: string
  content: string
  metaTitle: string
  metaDescription: string
}): SeoAnalysis {
  const titleKw = extractKeywords(title)
  const contentKw = extractKeywords(content)
  const metaTitleKw = extractKeywords(metaTitle || title)
  const metaDescKw = extractKeywords(metaDescription || excerpt)
  const allMeta = [...metaTitleKw, ...metaDescKw]

  // 1. Title length
  const titleLen = (metaTitle || title).length
  const titleLengthOk = titleLen >= 30 && titleLen <= 60
  const titleLengthWarn = titleLen > 0 && (titleLen < 30 || titleLen > 70)
  const titleLengthScore = titleLengthOk ? 1 : titleLen > 60 ? 0.4 : 0.6

  // 2. Keyword coverage in meta
  const allKw = [...new Set([...titleKw, ...contentKw.slice(0, 10)])]
  const covered = allKw.filter((k) => allMeta.includes(k)).length
  const keywordCoverage = allKw.length > 0 ? covered / allKw.length : 0.5
  const kwOk = keywordCoverage >= 0.5
  const kwWarn = keywordCoverage >= 0.25

  // 3. Title ↔ content match
  const titleMatch = overlap(titleKw, contentKw)
  const matchOk = titleMatch >= 0.4
  const matchWarn = titleMatch >= 0.2

  // 4. Meta description length
  const descLen = (metaDescription || excerpt || '').length
  const descOk = descLen >= 80 && descLen <= 155
  const descWarn = descLen > 0 && descLen < 80

  // 5. Bad phrases
  const hasBadPhrase = BAD_PHRASES.some(
    (p) => title.toLowerCase().includes(p) || (metaTitle || '').toLowerCase().includes(p)
  )

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        titleLengthScore * 25 +
        keywordCoverage * 35 +
        titleMatch * 25 +
        (descOk ? 1 : descWarn ? 0.5 : 0.2) * 15
      ) - (hasBadPhrase ? 10 : 0)
    )
  )

  const signals: SeoSignal[] = [
    {
      label: 'Longitud del título',
      status: titleLengthOk ? 'ok' : titleLengthWarn ? 'warn' : 'error',
      hint:
        titleLen === 0
          ? 'Escribe un título'
          : titleLen > 60
          ? `Muy largo (${titleLen} chars) — Google lo cortará en 60`
          : titleLen < 30
          ? `Muy corto (${titleLen} chars) — apuntá a 40–60`
          : `Perfecto (${titleLen} chars)`,
    },
    {
      label: 'Keywords en meta',
      status: kwOk ? 'ok' : kwWarn ? 'warn' : 'error',
      hint: kwOk
        ? 'Las palabras clave están bien representadas'
        : 'Algunas palabras clave del artículo no aparecen en el título o descripción SEO',
    },
    {
      label: 'Título vs contenido',
      status: matchOk ? 'ok' : matchWarn ? 'warn' : 'error',
      hint: matchOk
        ? 'El título refleja bien el contenido'
        : 'El título no coincide mucho con el contenido del artículo',
    },
    {
      label: 'Meta descripción',
      status: descOk ? 'ok' : descWarn ? 'warn' : 'error',
      hint:
        descLen === 0
          ? 'Sin descripción — se usará el resumen automáticamente'
          : descLen < 80
          ? `Muy corta (${descLen} chars) — apuntá a 80–155`
          : descLen > 155
          ? `Muy larga (${descLen} chars) — Google la cortará`
          : `Perfecto (${descLen} chars)`,
    },
    ...(hasBadPhrase
      ? [{
          label: 'Frases vagas',
          status: 'warn' as const,
          hint: 'El título contiene frases poco específicas como "todo lo que", "importante", etc.',
        }]
      : []),
  ]

  return {
    score,
    signals,
    topKeywords: [...new Set(titleKw)].slice(0, 5),
  }
}

export function scoreColor(score: number) {
  if (score >= 70) return 'text-green-600 dark:text-green-400'
  if (score >= 45) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-500'
}

export function scoreBg(score: number) {
  if (score >= 70) return 'bg-green-500'
  if (score >= 45) return 'bg-yellow-500'
  return 'bg-red-500'
}
