import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

async function loadFont(): Promise<Buffer | null> {
  // next/og incluye Noto Sans en su bundle — lo cargamos manualmente
  // para evitar el bug de file:// URL en Windows durante desarrollo
  try {
    return await readFile(
      join(process.cwd(), 'node_modules/next/dist/compiled/@vercel/og/noto-sans-v27-latin-regular.ttf'),
    )
  } catch {
    return null
  }
}

export const runtime = 'nodejs'
export const alt = 'Reporte Médico — La plataforma de salud líder en República Dominicana'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportemedico.com'

async function loadAsset(filename: string): Promise<string | null> {
  const mime = filename.endsWith('.png') ? 'image/png' : 'image/jpeg'

  // Intento 1 — filesystem (local / Docker standalone)
  try {
    const buffer = await readFile(join(process.cwd(), `public/media/${filename}`))
    return `data:${mime};base64,${buffer.toString('base64')}`
  } catch { /* continuar */ }

  // Intento 2 — fetch público (Vercel / CDN)
  try {
    const res = await fetch(`${SITE_URL}/media/${filename}`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    return `data:${mime};base64,${buffer.toString('base64')}`
  } catch (err) {
    console.error(`[opengraph-image] No se pudo cargar ${filename}:`, err)
    return null
  }
}

export default async function OpengraphImage() {
  const [bgSrc, logoSrc, fontData] = await Promise.all([
    loadAsset('logo-azul.jpeg'),
    loadAsset('logo-completo-claro.png'),
    loadFont(),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
        }}
      >
        {/* Fondo: logo-azul.jpeg a pantalla completa */}
        {bgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bgSrc}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          /* Fallback si no carga la imagen de fondo */
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #0A7B4B 0%, #00B4A0 100%)',
            }}
          />
        )}

        {/* Overlay oscuro para que el texto sea legible sobre el fondo */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.45)',
          }}
        />

        {/* Contenido sobre el fondo */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            padding: '72px 80px',
          }}
        >
          {/* Logo — un poco más grande que antes (300 → 340px) */}
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt="Reporte Médico"
              width={340}
              height={104}
              style={{ objectFit: 'contain', objectPosition: 'left center' }}
            />
          ) : (
            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: -1,
                display: 'flex',
              }}
            >
              REPORTE MÉDICO
            </div>
          )}

          {/* Texto inferior */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 'auto',
            }}
          >
            <div
              style={{
                fontSize: 26,
                color: 'rgba(255,255,255,0.80)',
                letterSpacing: 2,
                textTransform: 'uppercase',
                marginBottom: 18,
              }}
            >
              Salud · Información médica · República Dominicana
            </div>
            <div
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.05,
                maxWidth: 980,
                letterSpacing: -1.5,
              }}
            >
              La plataforma de salud líder del país
            </div>
            <div
              style={{
                marginTop: 28,
                fontSize: 24,
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              reportemedico.com
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      ...(fontData && {
        fonts: [{ name: 'Noto Sans', data: fontData, style: 'normal' as const, weight: 400 }],
      }),
    },
  )
}
