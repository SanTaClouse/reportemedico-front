/**
 * api.test.ts
 *
 * Tests del módulo lib/api.ts.
 * Mockea el global `fetch` para aislar las funciones del API real.
 *
 * Cubre: apiFetch (éxito / errores), ApiError, y todas las funciones
 *        de artículos (públicas y admin).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  ApiError,
  getHomeData,
  getArticles,
  getNews,
  getMedicalArticles,
  getArticleBySlug,
  getArticlesByTag,
  getRelatedByTag,
  incrementViews,
  submitArticle,
  createArticle,
  updateArticle,
  setArticleStatus,
  setArticleRelevance,
  deleteArticle,
  login,
} from '@/lib/api'

// ─── Helpers de mock ──────────────────────────────────────────────────────────

function mockFetchOk(data: unknown, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status,
    json: () => Promise.resolve(data),
  } as Response)
}

function mockFetchError(status: number, message?: string) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(message ? { message } : {}),
  } as Response)
}

function mockFetchNetworkError() {
  global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
}

// ─── Artículo de ejemplo ──────────────────────────────────────────────────────

const ARTICLE = {
  id: 'art-1',
  type: 'NEWS' as const,
  title: 'Artículo de prueba',
  slug: 'articulo-de-prueba',
  content: '<p>Contenido</p>',
  authorName: 'Reporte Médico',
  status: 'PUBLISHED' as const,
  relevance: 3 as const,
  viewsCount: 42,
  publishedAt: '2024-01-15T10:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  tags: [],
}

const PAGINATED = {
  data: [ARTICLE],
  meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
}

// ─── ApiError ─────────────────────────────────────────────────────────────────

describe('ApiError', () => {
  it('tiene name="ApiError" y expone el status HTTP', () => {
    const error = new ApiError(404, 'No encontrado')
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('ApiError')
    expect(error.status).toBe(404)
    expect(error.message).toBe('No encontrado')
  })
})

// ─── apiFetch — comportamiento base ───────────────────────────────────────────

describe('apiFetch — comportamiento base', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('hace fetch a la URL correcta y devuelve los datos', async () => {
    mockFetchOk(ARTICLE)

    const result = await getArticleBySlug('articulo-de-prueba')

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/articles/articulo-de-prueba'),
      expect.any(Object),
    )
    expect(result).toEqual(ARTICLE)
  })

  it('incluye Content-Type: application/json en los headers', async () => {
    mockFetchOk({})

    await getArticles()

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(options.headers['Content-Type']).toBe('application/json')
  })

  it('incluye Authorization cuando se provee token', async () => {
    mockFetchOk(ARTICLE)

    await createArticle({ title: 'T', content: 'C', type: 'NEWS' }, 'mi-token-jwt')

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(options.headers['Authorization']).toBe('Bearer mi-token-jwt')
  })

  it('lanza ApiError(404) con mensaje genérico cuando el server no manda message', async () => {
    mockFetchError(404)

    await expect(getArticleBySlug('no-existe')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'El recurso solicitado no existe.',
    })
  })

  it('lanza ApiError con el mensaje del servidor cuando está disponible', async () => {
    mockFetchError(400, 'Datos inválidos en el cuerpo')

    await expect(getArticles()).rejects.toMatchObject({
      status: 400,
      message: 'Datos inválidos en el cuerpo',
    })
  })

  it('lanza ApiError(401) con mensaje de autenticación', async () => {
    mockFetchError(401)

    await expect(getArticles()).rejects.toMatchObject({
      status: 401,
      message: 'No autenticado. Por favor iniciá sesión.',
    })
  })

  it('lanza ApiError(500) con mensaje genérico', async () => {
    mockFetchError(500)

    await expect(getArticles()).rejects.toMatchObject({
      status: 500,
    })
  })

  it('propaga errores de red (TypeError) sin envolver en ApiError', async () => {
    mockFetchNetworkError()

    await expect(getArticles()).rejects.toBeInstanceOf(TypeError)
  })
})

// ─── Endpoints públicos de artículos ─────────────────────────────────────────

describe('getHomeData()', () => {
  it('llama a GET /articles/home con revalidate=300', async () => {
    const homeData = { hero: ARTICLE, featured: [], latest: [], medicalArticles: [] }
    mockFetchOk(homeData)

    const result = await getHomeData()

    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/articles/home')
    expect(opts?.next?.revalidate).toBe(300)
    expect(result).toEqual(homeData)
  })
})

describe('getArticles()', () => {
  it('llama a GET /articles con page y limit correctos', async () => {
    mockFetchOk(PAGINATED)

    await getArticles(3, 5)

    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/articles?page=3&limit=5')
  })

  it('usa page=1, limit=10 como defaults', async () => {
    mockFetchOk(PAGINATED)

    await getArticles()

    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('page=1&limit=10')
  })
})

describe('getNews()', () => {
  it('llama a GET /articles/type/news', async () => {
    mockFetchOk(PAGINATED)

    await getNews(2, 15)

    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/articles/type/news?page=2&limit=15')
  })
})

describe('getMedicalArticles()', () => {
  it('llama a GET /articles/type/medical', async () => {
    mockFetchOk(PAGINATED)

    await getMedicalArticles()

    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/articles/type/medical')
  })
})

describe('getArticleBySlug()', () => {
  it('llama a GET /articles/:slug con revalidate=600', async () => {
    mockFetchOk(ARTICLE)

    await getArticleBySlug('mi-slug')

    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/articles/mi-slug')
    expect(opts?.next?.revalidate).toBe(600)
  })
})

describe('getArticlesByTag()', () => {
  it('llama a GET /articles/tag/:slug con paginación', async () => {
    mockFetchOk(PAGINATED)

    await getArticlesByTag('cardiologia', 2)

    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/articles/tag/cardiologia?page=2')
  })
})

describe('getRelatedByTag()', () => {
  it('incluye sort=views_desc y el límite en la URL', async () => {
    mockFetchOk(PAGINATED)

    await getRelatedByTag('neurologia', 6)

    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('sort=views_desc')
    expect(url).toContain('limit=6')
  })
})

describe('incrementViews()', () => {
  it('llama a POST /articles/:slug/view', async () => {
    mockFetchOk({})

    await incrementViews('test-slug')

    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/articles/test-slug/view')
    expect(opts?.method).toBe('POST')
  })
})

describe('submitArticle()', () => {
  it('envía POST /articles/submit con el body correcto', async () => {
    const submitData = {
      title: 'Mi Artículo',
      content: '<p>Contenido</p>',
      authorName: 'Dr. García',
    }
    mockFetchOk({ id: 'new-1', ...submitData })

    await submitArticle(submitData)

    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/articles/submit')
    expect(opts?.method).toBe('POST')
    expect(JSON.parse(opts?.body as string)).toEqual(submitData)
  })
})

// ─── Endpoints admin de artículos ─────────────────────────────────────────────

describe('createArticle()', () => {
  it('envía POST /articles con Authorization header y body', async () => {
    const data = { type: 'NEWS', title: 'Noticia', content: '<p>C</p>' }
    mockFetchOk(ARTICLE)

    await createArticle(data, 'jwt-token-admin')

    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/articles')
    expect(opts?.method).toBe('POST')
    expect(opts?.headers['Authorization']).toBe('Bearer jwt-token-admin')
    expect(JSON.parse(opts?.body as string)).toEqual(data)
  })
})

describe('updateArticle()', () => {
  it('envía PATCH /articles/:id con Authorization y body', async () => {
    const data = { title: 'Nuevo Título' }
    mockFetchOk(ARTICLE)

    await updateArticle('art-42', data, 'jwt-token-admin')

    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/articles/art-42')
    expect(opts?.method).toBe('PATCH')
    expect(opts?.headers['Authorization']).toBe('Bearer jwt-token-admin')
  })
})

describe('setArticleStatus()', () => {
  it('envía PATCH /articles/:id/status con el status en el body', async () => {
    mockFetchOk(ARTICLE)

    await setArticleStatus('art-1', 'PUBLISHED', 'jwt-token')

    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/articles/art-1/status')
    expect(opts?.method).toBe('PATCH')
    expect(JSON.parse(opts?.body as string)).toEqual({ status: 'PUBLISHED' })
  })
})

describe('setArticleRelevance()', () => {
  it('envía PATCH /articles/:id/relevance con la relevance en el body', async () => {
    mockFetchOk(ARTICLE)

    await setArticleRelevance('art-1', 2, 'jwt-token')

    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/articles/art-1/relevance')
    expect(opts?.method).toBe('PATCH')
    expect(JSON.parse(opts?.body as string)).toEqual({ relevance: 2 })
  })
})

describe('deleteArticle()', () => {
  it('envía DELETE /articles/:id con Authorization', async () => {
    mockFetchOk({})

    await deleteArticle('art-1', 'jwt-token')

    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/articles/art-1')
    expect(opts?.method).toBe('DELETE')
    expect(opts?.headers['Authorization']).toBe('Bearer jwt-token')
  })
})

// ─── Autenticación ────────────────────────────────────────────────────────────

describe('login()', () => {
  it('envía POST /auth/login con email y password', async () => {
    const tokenResponse = {
      token: 'jwt-response-token',
      user: { id: '1', email: 'admin@rm.com', role: 'ADMIN' },
    }
    mockFetchOk(tokenResponse)

    const result = await login('admin@reportemedico.com', 'contraseña123')

    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/auth/login')
    expect(opts?.method).toBe('POST')
    expect(JSON.parse(opts?.body as string)).toEqual({
      email: 'admin@reportemedico.com',
      password: 'contraseña123',
    })
    expect(result).toEqual(tokenResponse)
  })

  it('lanza ApiError(401) con credenciales inválidas', async () => {
    mockFetchError(401, 'Credenciales inválidas')

    await expect(login('wrong@email.com', 'wrong')).rejects.toMatchObject({
      status: 401,
      message: 'Credenciales inválidas',
    })
  })
})
