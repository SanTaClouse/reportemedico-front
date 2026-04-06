import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const runtime = 'nodejs'
export const alt = 'Reporte Médico — La plataforma de salud líder en República Dominicana'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const logoBuffer = await readFile(
    join(process.cwd(), 'public/media/logo-completo-claro.png'),
  )
  const logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background:
            'linear-gradient(135deg, #0A7B4B 0%, #0A7B4B 55%, #00B4A0 100%)',
          padding: '80px',
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

        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt="Reporte Médico"
          width={260}
          height={80}
          style={{ objectFit: 'contain' }}
        />

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
