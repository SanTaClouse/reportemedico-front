import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const runtime = 'nodejs'
export const alt = 'Reporte Médico — La plataforma de salud líder en República Dominicana'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportemedico.com'

async function loadLogo(): Promise<string | null> {
  // Intento 1 — filesystem (rápido en local/standalone)
  try {
    const buffer = await readFile(
      join(process.cwd(), 'public/media/Logo-Blanco-y-amarillo-sin-fondo-300-100-para-opengraph.png'),
    )
    return `data:image/png;base64,${buffer.toString('base64')}`
  } catch (err) {
    console.warn('[opengraph-image] readFile del logo falló, intentando fetch:', err)
  }
  // Intento 2 — fetch público (caso Vercel donde public/ no está en el bundle)
  try {
    const res = await fetch(`${SITE_URL}/media/Logo-Blanco-y-amarillo-sin-fondo-300-100-para-opengraph.png`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    return `data:image/png;base64,${buffer.toString('base64')}`
  } catch (err) {
    console.error('[opengraph-image] No se pudo cargar el logo:', err)
    return null
  }
}

export default async function OpengraphImage() {
  const logoSrc = await loadLogo()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background:
            'linear-gradient(135deg, #0d256c 0%, #071e61 55%, #09297f 100%)',
          padding: '30px',
          position: 'relative',
        }}
      >
        {/* Decoración */}
        <div
          style={{
            position: 'absolute',
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -150,
            left: -150,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
          }}
        />

        {/* Logo (con fallback de texto si no se pudo cargar) */}
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            alt="Reporte Médico"
            width={260}
            height={80}
            style={{ objectFit: 'contain' }}
          />
        ) : (
          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: -1,
              display: 'flex',
            }}
          >
            REPORTE MÉDICO
          </div>
        )}

        {/* Contenido */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
          }}
        >
          <div
            style={{
              fontSize: 28,
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            Salud · Información médica · República Dominicana
          </div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.05,
              maxWidth: 1000,
              letterSpacing: -1.5,
            }}
          >
            La plataforma de salud líder del país
          </div>
          <div
            style={{
              marginTop: 32,
              fontSize: 26,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            reportemedico.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
