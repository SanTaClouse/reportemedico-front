import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Article } from './api'
import { baseImageUrl, getImageCrop } from './cloudinary'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportemedico.com'
const LOGO_PUBLIC_PATH = '/media/logo-completo-claro.png'
// Logo blanco+amarillo sin fondo: se lee sobre fondos oscuros (panel verde de la story card)
const LOGO_WHITE_PUBLIC_PATH = '/media/Logo-Blanco-y-amarillo-sin-fondo-1000-334-para-opengraph.png'

let cachedLogo: string | null = null
let logoLoadFailed = false
let cachedWhiteLogo: string | null = null
let whiteLogoLoadFailed = false

/**
 * Carga el logo de forma resiliente:
 * 1. Intenta leer el archivo desde el filesystem (rápido en local/standalone)
 * 2. Si falla (caso Vercel: public/ no está en el bundle de la función),
 *    fetchea el logo desde el URL público del sitio
 * 3. Si todo falla, devuelve null y el render usa un placeholder de texto
 */
async function getLogoDataUri(): Promise<string | null> {
  if (cachedLogo) return cachedLogo
  if (logoLoadFailed) return null

  // Intento 1 — filesystem local
  try {
    const buffer = await readFile(
      join(process.cwd(), 'public/media/logo-completo-claro.png'),
    )
    cachedLogo = `data:image/png;base64,${buffer.toString('base64')}`
    return cachedLogo
  } catch (err) {
    console.warn('[og-image] readFile del logo falló, intentando fetch:', err)
  }

  // Intento 2 — fetch público
  try {
    const res = await fetch(`${SITE_URL}${LOGO_PUBLIC_PATH}`, {
      // Cachear la respuesta a nivel data-cache; el logo no cambia
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    cachedLogo = `data:image/png;base64,${buffer.toString('base64')}`
    return cachedLogo
  } catch (err) {
    console.error('[og-image] No se pudo cargar el logo por fetch:', err)
    logoLoadFailed = true
    return null
  }
}

/** Versión blanca del logo para fondos oscuros. Mismo patrón resiliente que getLogoDataUri. */
async function getWhiteLogoDataUri(): Promise<string | null> {
  if (cachedWhiteLogo) return cachedWhiteLogo
  if (whiteLogoLoadFailed) return null

  try {
    const buffer = await readFile(join(process.cwd(), `public${LOGO_WHITE_PUBLIC_PATH}`))
    cachedWhiteLogo = `data:image/png;base64,${buffer.toString('base64')}`
    return cachedWhiteLogo
  } catch (err) {
    console.warn('[story-card] readFile del logo blanco falló, intentando fetch:', err)
  }

  try {
    const res = await fetch(`${SITE_URL}${LOGO_WHITE_PUBLIC_PATH}`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    cachedWhiteLogo = `data:image/png;base64,${buffer.toString('base64')}`
    return cachedWhiteLogo
  } catch (err) {
    console.error('[story-card] No se pudo cargar el logo blanco:', err)
    whiteLogoLoadFailed = true
    return null
  }
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max - 1).trimEnd() + '…'
}

/**
 * Convierte una URL de Cloudinary en una variante que Satori (next/og)
 * pueda decodificar SIEMPRE: JPG forzado, sin f_auto, dimensiones fijas.
 *
 * Satori solo soporta PNG y JPEG — si Cloudinary sirve WebP/AVIF (que es lo
 * default con f_auto), la generación de la OG image falla y Next.js cae al
 * fallback del padre (que en nuestro caso es solo el logo).
 */
function toOgSafeImageUrl(src: string | null | undefined): string | null {
  if (!src) return null
  const crop = getImageCrop(src)
  const base = baseImageUrl(src)
  if (!base.includes('res.cloudinary.com') || !base.includes('/upload/')) {
    // Imagen externa: la pasamos tal cual y confiamos en que sea jpg/png
    return base
  }
  // Eliminar transformaciones previas que pudiéramos haber inyectado
  const cleaned = base.replace(/\/upload\/(?:[^/]*[cwhgqf]_[^/]*\/)+/, '/upload/')
  // Honrar el recuadre manual (#crop) si existe; si no, encuadre automático en la cara
  const transform = crop
    ? `c_crop,x_${crop.x},y_${crop.y},w_${crop.w},h_${crop.h}/c_fill,w_960,h_1260,q_auto:good,f_jpg`
    : 'c_fill,g_auto:faces,w_960,h_1260,q_auto:good,f_jpg'
  return cleaned.replace('/upload/', `/upload/${transform}/`)
}

/**
 * Igual que toOgSafeImageUrl pero recorta en formato VERTICAL (9:16-ish) para
 * la zona de foto de la story card. Satori solo decodifica PNG/JPEG, por eso
 * forzamos f_jpg y eliminamos f_auto.
 */
function toStoryImageUrl(src: string | null | undefined): string | null {
  if (!src) return null
  const crop = getImageCrop(src)
  const base = baseImageUrl(src)
  if (!base.includes('res.cloudinary.com') || !base.includes('/upload/')) {
    return base
  }
  const cleaned = base.replace(/\/upload\/(?:[^/]*[cwhgqf]_[^/]*\/)+/, '/upload/')
  const transform = crop
    ? `c_crop,x_${crop.x},y_${crop.y},w_${crop.w},h_${crop.h}/c_fill,w_1080,h_1180,q_auto:good,f_jpg`
    : 'c_fill,g_auto:faces,w_1080,h_1180,q_auto:good,f_jpg'
  return cleaned.replace('/upload/', `/upload/${transform}/`)
}

/**
 * Pre-fetchea la imagen destacada como ArrayBuffer para que Satori la consuma
 * via data URI. Esto evita que Satori tenga que hacer su propio fetch (que
 * puede fallar silenciosamente y reventar todo el render).
 */
async function fetchImageAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/jpeg') && !contentType.startsWith('image/png')) {
      throw new Error(`formato no soportado por Satori: ${contentType}`)
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    return `data:${contentType};base64,${buffer.toString('base64')}`
  } catch (err) {
    console.warn('[og-image] No se pudo precargar imagen destacada:', err)
    return null
  }
}

interface RenderOptions {
  article: Article
  kind: 'Noticia' | 'Artículo médico'
}

/**
 * Renderiza la OG card de un artículo.
 * Layout: imagen destacada a la izquierda (o gradiente si no hay), contenido a la derecha.
 *
 * Si CUALQUIER paso falla, cae a un fallback text-only en vez de devolver 500.
 */
export async function renderArticleOgImage({ article, kind }: RenderOptions) {
  try {
    const [logoSrc, ogImageUrl] = await Promise.all([
      getLogoDataUri(),
      Promise.resolve(toOgSafeImageUrl(article.featuredImage)),
    ])

    const featuredDataUri = ogImageUrl ? await fetchImageAsDataUri(ogImageUrl) : null
    const hasImage = Boolean(featuredDataUri)
    const title = truncate(article.title, 110)
    const tagName = article.tags?.[0]?.tag?.name
    const authorName = article.authorName?.trim() || 'Redacción Reporte Médico'

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            background: '#ffffff',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Lado izquierdo: imagen o gradiente */}
          <div
            style={{
              width: 480,
              height: '100%',
              display: 'flex',
              position: 'relative',
              background:
                'linear-gradient(160deg, #0A7B4B 0%, #0A7B4B 60%, #00B4A0 100%)',
            }}
          >
            {hasImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featuredDataUri as string}
                alt=""
                width={480}
                height={630}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}
            {/* Overlay sutil */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(10,123,75,0) 60%, rgba(10,123,75,0.55) 100%)',
              }}
            />
          </div>

          {/* Lado derecho: contenido */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '60px 64px',
              background: '#ffffff',
            }}
          >
            {/* Header: badge + logo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 40,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#0A7B4B',
                  color: '#ffffff',
                  padding: '10px 22px',
                  borderRadius: 999,
                  fontSize: 22,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                {kind}
              </div>
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoSrc}
                  alt="Reporte Médico"
                  width={150}
                  height={46}
                  style={{ objectFit: 'contain' }}
                />
              ) : (
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#0A7B4B',
                    display: 'flex',
                  }}
                >
                  REPORTE MÉDICO
                </div>
              )}
            </div>

            {/* Tag opcional */}
            {tagName && (
              <div
                style={{
                  fontSize: 22,
                  color: '#00B4A0',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                  marginBottom: 16,
                }}
              >
                {tagName}
              </div>
            )}

            {/* Título */}
            <div
              style={{
                fontSize: title.length > 70 ? 46 : 56,
                fontWeight: 700,
                color: '#111827',
                lineHeight: 1.1,
                letterSpacing: -1,
                display: 'flex',
              }}
            >
              {title}
            </div>

            {/* Footer: autor */}
            <div
              style={{
                marginTop: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                paddingTop: 32,
                borderTop: '2px solid #E5E7EB',
                fontSize: 24,
                color: '#4B5563',
              }}
            >
              <span style={{ color: '#0A7B4B', fontWeight: 600 }}>
                Por {authorName}
              </span>
              <span>·</span>
              <span>reportemedico.com</span>
            </div>
          </div>
        </div>
      ),
      { ...OG_SIZE },
    )
  } catch (err) {
    console.error('[og-image] Render principal falló, devolviendo fallback:', err)
    return renderFallbackCard(article.title, kind)
  }
}

/**
 * Card text-only de emergencia. No depende de imágenes externas ni del logo.
 * Garantiza que NUNCA devolvamos 500 desde una ruta opengraph-image.
 */
function renderFallbackCard(title: string, kind: 'Noticia' | 'Artículo médico') {
  const safeTitle = truncate(title, 140)
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 80,
          background:
            'linear-gradient(135deg, #0A7B4B 0%, #0A7B4B 55%, #00B4A0 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 24,
            letterSpacing: 2,
            textTransform: 'uppercase',
            opacity: 0.85,
            marginBottom: 24,
          }}
        >
          {kind} · Reporte Médico
        </div>
        <div
          style={{
            fontSize: safeTitle.length > 90 ? 56 : 68,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -1.5,
            display: 'flex',
          }}
        >
          {safeTitle}
        </div>
        <div
          style={{
            marginTop: 'auto',
            fontSize: 26,
            opacity: 0.9,
          }}
        >
          reportemedico.com
        </div>
      </div>
    ),
    { ...OG_SIZE },
  )
}

// ───────────────────────────── STORY CARD (1080×1920) ─────────────────────────────

export const STORY_SIZE = { width: 1080, height: 1920 }
export const STORY_CONTENT_TYPE = 'image/png'

// Cache-Control para la ruta /api/story-card. La card cambia poco; permite que
// el CDN la sirva sin re-renderizar Satori en cada compartido.
const STORY_HEADERS = {
  'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
}

/**
 * Renderiza la story card vertical (formato Instagram/WhatsApp Stories).
 * Layout "editorial": foto arriba (~60%), panel verde de marca abajo con
 * tag, título y logo. Cae a un fallback sin foto si algo falla.
 */
export async function renderStoryCard({ article }: { article: Article }) {
  try {
    const [whiteLogo, storyImageUrl] = await Promise.all([
      getWhiteLogoDataUri(),
      Promise.resolve(toStoryImageUrl(article.featuredImage)),
    ])

    const featuredDataUri = storyImageUrl ? await fetchImageAsDataUri(storyImageUrl) : null
    const hasImage = Boolean(featuredDataUri)
    const eyebrow = (article.tags?.[0]?.tag?.name || 'Salud').toUpperCase()
    const title = truncate(article.title, 130)
    const titleSize = title.length > 90 ? 60 : title.length > 55 ? 72 : 84

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(160deg, #0A7B4B 0%, #086b41 100%)',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Zona de foto (arriba) */}
          <div
            style={{
              width: '100%',
              height: 1180,
              display: 'flex',
              position: 'relative',
              background:
                'linear-gradient(160deg, #0A7B4B 0%, #0A7B4B 55%, #00B4A0 100%)',
            }}
          >
            {hasImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featuredDataUri as string}
                alt=""
                width={1080}
                height={1180}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
            {/* Transición suave hacia el panel verde */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(10,123,75,0) 78%, rgba(10,123,75,0.95) 100%)',
              }}
            />
          </div>

          {/* Panel verde de marca (abajo) */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '64px 72px 72px',
            }}
          >
            {/* Eyebrow: categoría */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                marginBottom: 28,
              }}
            >
              <div style={{ width: 56, height: 6, background: '#FFD23F', borderRadius: 999, display: 'flex' }} />
              <div
                style={{
                  fontSize: 30,
                  color: '#9FE7CF',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 3,
                  display: 'flex',
                }}
              >
                {eyebrow}
              </div>
            </div>

            {/* Título */}
            <div
              style={{
                fontSize: titleSize,
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.08,
                letterSpacing: -1.5,
                display: 'flex',
              }}
            >
              {title}
            </div>

            {/* Footer: logo + dominio */}
            <div
              style={{
                marginTop: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 40,
                borderTop: '2px solid rgba(255,255,255,0.25)',
              }}
            >
              {whiteLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={whiteLogo}
                  alt="Reporte Médico"
                  width={258}
                  height={86}
                  style={{ objectFit: 'contain' }}
                />
              ) : (
                <div style={{ fontSize: 38, fontWeight: 800, color: '#ffffff', display: 'flex' }}>
                  REPORTE MÉDICO
                </div>
              )}
              <div style={{ fontSize: 30, color: 'rgba(255,255,255,0.9)', fontWeight: 600, display: 'flex' }}>
                reportemedico.com
              </div>
            </div>
          </div>
        </div>
      ),
      { ...STORY_SIZE, headers: STORY_HEADERS },
    )
  } catch (err) {
    console.error('[story-card] Render principal falló, devolviendo fallback:', err)
    return renderStoryFallback(article.title)
  }
}

/** Story card de emergencia: sin foto, solo marca. Nunca devuelve 500. */
function renderStoryFallback(title: string) {
  const safeTitle = truncate(title, 150)
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '120px 80px',
          background: 'linear-gradient(160deg, #0A7B4B 0%, #0A7B4B 55%, #00B4A0 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 30,
            letterSpacing: 3,
            textTransform: 'uppercase',
            opacity: 0.85,
            marginBottom: 32,
            display: 'flex',
          }}
        >
          Reporte Médico
        </div>
        <div
          style={{
            fontSize: safeTitle.length > 90 ? 64 : 80,
            fontWeight: 800,
            lineHeight: 1.06,
            letterSpacing: -1.5,
            display: 'flex',
          }}
        >
          {safeTitle}
        </div>
        <div style={{ marginTop: 48, fontSize: 32, opacity: 0.9, display: 'flex' }}>
          reportemedico.com
        </div>
      </div>
    ),
    { ...STORY_SIZE },
  )
}
