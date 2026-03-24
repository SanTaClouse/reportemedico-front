/**
 * ArticleCard.test.tsx
 *
 * Tests del componente ArticleCard con todas sus variantes.
 * Verifica renderizado, routing y comportamiento condicional.
 *
 * next/link y next/image están mockeados en vitest.setup.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ArticleCard from '@/components/article/ArticleCard'
import type { Article } from '@/lib/api'

// ─── Mock de TagBadge ──────────────────────────────────────────────────────────

vi.mock('@/components/ui/TagBadge', () => ({
  default: ({ tag }: { tag: { name: string } }) => (
    <span data-testid="tag-badge">{tag.name}</span>
  ),
}))

// ─── Factory de artículo ──────────────────────────────────────────────────────

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: 'art-1',
    type: 'NEWS',
    title: 'Nuevo avance en tratamiento de diabetes',
    slug: 'avance-diabetes',
    excerpt: 'Científicos descubren un nuevo enfoque para el tratamiento.',
    content: '<p>El contenido completo del artículo sobre diabetes con más detalle médico.</p>',
    authorName: 'Dr. Fernández',
    status: 'PUBLISHED',
    relevance: 3,
    viewsCount: 150,
    publishedAt: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    tags: [{ tag: { id: 'tag-1', name: 'Endocrinología', slug: 'endocrinologia' } }],
    ...overrides,
  }
}

// ─── Variante "principal" (default) ───────────────────────────────────────────

describe('ArticleCard — variante principal (default)', () => {
  it('muestra el título del artículo', () => {
    render(<ArticleCard article={makeArticle()} />)
    expect(screen.getByText('Nuevo avance en tratamiento de diabetes')).toBeInTheDocument()
  })

  it('muestra el extracto cuando existe', () => {
    render(<ArticleCard article={makeArticle()} />)
    expect(
      screen.getByText('Científicos descubren un nuevo enfoque para el tratamiento.'),
    ).toBeInTheDocument()
  })

  it('no muestra extracto si no existe', () => {
    render(<ArticleCard article={makeArticle({ excerpt: undefined })} />)
    expect(
      screen.queryByText('Científicos descubren un nuevo enfoque para el tratamiento.'),
    ).not.toBeInTheDocument()
  })

  it('muestra el nombre del autor', () => {
    render(<ArticleCard article={makeArticle()} />)
    expect(screen.getByText('Dr. Fernández')).toBeInTheDocument()
  })

  it('el enlace apunta a /noticias/:slug para artículos NEWS', () => {
    render(<ArticleCard article={makeArticle({ type: 'NEWS', slug: 'mi-noticia' })} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/noticias/mi-noticia')
  })

  it('el enlace apunta a /articulos/:slug para MEDICAL_ARTICLE', () => {
    render(<ArticleCard article={makeArticle({ type: 'MEDICAL_ARTICLE', slug: 'mi-articulo' })} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/articulos/mi-articulo')
  })

  it('muestra la imagen destacada cuando existe', () => {
    render(
      <ArticleCard article={makeArticle({ featuredImage: 'https://cdn.example.com/img.jpg' })} />,
    )
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/img.jpg')
    expect(img).toHaveAttribute('alt', 'Nuevo avance en tratamiento de diabetes')
  })

  it('no renderiza imagen cuando featuredImage es null', () => {
    render(<ArticleCard article={makeArticle({ featuredImage: undefined })} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('muestra el tag badge del primer tag', () => {
    render(<ArticleCard article={makeArticle()} />)
    expect(screen.getByTestId('tag-badge')).toHaveTextContent('Endocrinología')
  })

  it('no muestra tag badge si el artículo no tiene tags', () => {
    render(<ArticleCard article={makeArticle({ tags: [] })} />)
    expect(screen.queryByTestId('tag-badge')).not.toBeInTheDocument()
  })
})

// ─── Variante "compacta" ──────────────────────────────────────────────────────

describe('ArticleCard — variante compacta', () => {
  it('muestra el título en formato compacto', () => {
    render(<ArticleCard article={makeArticle()} variant="compacta" />)
    expect(screen.getByText('Nuevo avance en tratamiento de diabetes')).toBeInTheDocument()
  })

  it('el enlace apunta a la URL correcta según tipo', () => {
    render(<ArticleCard article={makeArticle({ slug: 'slug-compact', type: 'NEWS' })} variant="compacta" />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/noticias/slug-compact')
  })

  it('muestra la imagen en tamaño pequeño cuando existe', () => {
    render(
      <ArticleCard
        article={makeArticle({ featuredImage: 'https://cdn.example.com/small.jpg' })}
        variant="compacta"
      />,
    )
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
  })

  it('muestra el nombre del primer tag en texto', () => {
    render(<ArticleCard article={makeArticle()} variant="compacta" />)
    expect(screen.getByText('Endocrinología')).toBeInTheDocument()
  })
})

// ─── Variante "minima" ────────────────────────────────────────────────────────

describe('ArticleCard — variante minima', () => {
  it('muestra el título del artículo', () => {
    render(<ArticleCard article={makeArticle()} variant="minima" />)
    expect(screen.getByText('Nuevo avance en tratamiento de diabetes')).toBeInTheDocument()
  })

  it('el enlace apunta a la URL correcta', () => {
    render(
      <ArticleCard
        article={makeArticle({ type: 'MEDICAL_ARTICLE', slug: 'articulo-medico' })}
        variant="minima"
      />,
    )
    expect(screen.getByRole('link')).toHaveAttribute('href', '/articulos/articulo-medico')
  })

  it('no renderiza imagen en la variante mínima', () => {
    render(
      <ArticleCard
        article={makeArticle({ featuredImage: 'https://example.com/img.jpg' })}
        variant="minima"
      />,
    )
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

// ─── Variante "lead" ──────────────────────────────────────────────────────────

describe('ArticleCard — variante lead', () => {
  it('muestra el título con tipografía de display', () => {
    render(<ArticleCard article={makeArticle()} variant="lead" />)
    expect(screen.getByText('Nuevo avance en tratamiento de diabetes')).toBeInTheDocument()
  })

  it('muestra el extracto', () => {
    render(<ArticleCard article={makeArticle()} variant="lead" />)
    expect(
      screen.getByText('Científicos descubren un nuevo enfoque para el tratamiento.'),
    ).toBeInTheDocument()
  })

  it('el enlace apunta correctamente según tipo', () => {
    render(
      <ArticleCard
        article={makeArticle({ type: 'NEWS', slug: 'noticia-lead' })}
        variant="lead"
      />,
    )
    expect(screen.getByRole('link')).toHaveAttribute('href', '/noticias/noticia-lead')
  })

  it('muestra la imagen a pantalla completa con fill', () => {
    render(
      <ArticleCard
        article={makeArticle({ featuredImage: 'https://cdn.example.com/lead.jpg' })}
        variant="lead"
      />,
    )
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/lead.jpg')
  })

  it('muestra el nombre del autor y tiempo de lectura', () => {
    render(<ArticleCard article={makeArticle()} variant="lead" />)
    expect(screen.getByText('Dr. Fernández')).toBeInTheDocument()
    // El tiempo de lectura debería aparecer como "X min"
    expect(screen.getByText(/min/)).toBeInTheDocument()
  })
})

// ─── Indicador "reciente" ─────────────────────────────────────────────────────

describe('ArticleCard — indicador de artículo reciente', () => {
  it('muestra el indicador de ping cuando el artículo se publicó hace menos de 2 horas', () => {
    const recentDate = new Date(Date.now() - 30 * 60 * 1000).toISOString() // hace 30 min
    const { container } = render(
      <ArticleCard article={makeArticle({ publishedAt: recentDate })} variant="principal" />,
    )
    // El indicador de ping usa animate-ping como clase CSS
    expect(container.querySelector('.animate-ping')).toBeInTheDocument()
  })

  it('NO muestra el indicador cuando el artículo es antiguo', () => {
    const oldDate = '2020-01-01T00:00:00Z' // muy antiguo
    const { container } = render(
      <ArticleCard article={makeArticle({ publishedAt: oldDate })} variant="principal" />,
    )
    expect(container.querySelector('.animate-ping')).not.toBeInTheDocument()
  })

  it('NO muestra el indicador cuando publishedAt es undefined', () => {
    const { container } = render(
      <ArticleCard
        article={makeArticle({ publishedAt: undefined })}
        variant="principal"
      />,
    )
    expect(container.querySelector('.animate-ping')).not.toBeInTheDocument()
  })
})

// ─── Routing por tipo de artículo ─────────────────────────────────────────────

describe('ArticleCard — routing por tipo', () => {
  it.each([
    ['NEWS', 'mi-noticia', '/noticias/mi-noticia'],
    ['MEDICAL_ARTICLE', 'mi-articulo-medico', '/articulos/mi-articulo-medico'],
  ] as const)(
    'tipo %s con slug %s genera href %s',
    (type, slug, expectedHref) => {
      render(
        <ArticleCard
          article={makeArticle({ type, slug })}
          variant="principal"
        />,
      )
      expect(screen.getByRole('link')).toHaveAttribute('href', expectedHref)
    },
  )
})
