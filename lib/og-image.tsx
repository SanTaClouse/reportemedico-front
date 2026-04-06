import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Article } from './api'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

let cachedLogo: string | null = null

async function getLogoDataUri(): Promise<string> {
  if (cachedLogo) return cachedLogo
  const buffer = await readFile(
    join(process.cwd(), 'public/media/logo-completo-claro.png'),
  )
  cachedLogo = `data:image/png;base64,${buffer.toString('base64')}`
  return cachedLogo
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max - 1).trimEnd() + '…'
}

interface RenderOptions {
  article: Article
  kind: 'Noticia' | 'Artículo médico'
}

/**
 * Renderiza la OG card de un artículo.
 * Layout: imagen destacada a la izquierda (o gradiente si no hay), contenido a la derecha.
 */
export async function renderArticleOgImage({ article, kind }: RenderOptions) {
  const logoSrc = await getLogoDataUri()
  const title = truncate(article.title, 110)
  const tagName = article.tags?.[0]?.tag?.name
  const hasImage = Boolean(article.featuredImage)

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
              src={article.featuredImage as string}
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="Reporte Médico"
              width={150}
              height={46}
              style={{ objectFit: 'contain' }}
            />
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
              Por {article.authorName}
            </span>
            <span>·</span>
            <span>reportemedico.com</span>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  )
}
