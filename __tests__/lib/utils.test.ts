/**
 * utils.test.ts
 *
 * Tests de las funciones utilitarias puras de lib/utils.ts.
 * No requieren mocks ni DOM.
 */

import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateShort,
  readingTime,
  truncate,
  cn,
  issuuCoverUrl,
  embedUrlToDirectUrl,
} from '@/lib/utils'

// ─── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate()', () => {
  it('formatea una fecha ISO en formato largo en español', () => {
    // Nota: el formato exacto depende del locale es-DO; verificamos partes clave
    const result = formatDate('2024-06-15T10:00:00Z')
    expect(result).toMatch(/2024/)
    expect(result).toMatch(/15/)
  })

  it('incluye el nombre del mes en español', () => {
    const result = formatDate('2024-03-20T00:00:00Z')
    // "marzo" debe aparecer en alguna forma
    expect(result.toLowerCase()).toMatch(/mar/)
  })

  it('no lanza error con fechas en distintos formatos válidos', () => {
    expect(() => formatDate('2023-01-01')).not.toThrow()
    expect(() => formatDate('2023-12-31T23:59:59.999Z')).not.toThrow()
  })
})

// ─── formatDateShort ──────────────────────────────────────────────────────────

describe('formatDateShort()', () => {
  it('produce una cadena más corta que formatDate', () => {
    const date = '2024-06-15T10:00:00Z'
    const short = formatDateShort(date)
    const full = formatDate(date)
    // La versión corta usa "short" para el mes, la larga usa "long"
    expect(short.length).toBeLessThanOrEqual(full.length)
  })

  it('incluye el año de 4 dígitos', () => {
    const result = formatDateShort('2024-11-07T00:00:00Z')
    expect(result).toMatch(/2024/)
  })
})

// ─── readingTime ──────────────────────────────────────────────────────────────

describe('readingTime()', () => {
  it('devuelve 1 para contenido vacío', () => {
    expect(readingTime('')).toBe(1)
  })

  it('devuelve 1 para textos muy cortos', () => {
    expect(readingTime('<p>Hola mundo</p>')).toBe(1)
  })

  it('calcula 1 minuto para ~200 palabras', () => {
    const text = 'palabra '.repeat(200)
    expect(readingTime(text)).toBe(1)
  })

  it('calcula 2 minutos para ~400 palabras', () => {
    const text = 'palabra '.repeat(400)
    expect(readingTime(text)).toBe(2)
  })

  it('calcula 3 minutos para ~600 palabras', () => {
    const text = 'palabra '.repeat(600)
    expect(readingTime(text)).toBe(3)
  })

  it('ignora las etiquetas HTML al contar palabras', () => {
    const htmlWith200Words = '<p>' + 'palabra '.repeat(200) + '</p>'
    const plainWith200Words = 'palabra '.repeat(200)
    expect(readingTime(htmlWith200Words)).toBe(readingTime(plainWith200Words))
  })

  it('el tiempo mínimo es siempre 1 (nunca 0)', () => {
    expect(readingTime('una')).toBe(1)
  })
})

// ─── truncate ─────────────────────────────────────────────────────────────────

describe('truncate()', () => {
  it('no modifica texto más corto que el límite', () => {
    expect(truncate('Hola', 10)).toBe('Hola')
  })

  it('no modifica texto exactamente igual al límite', () => {
    expect(truncate('12345', 5)).toBe('12345')
  })

  it('trunca y agrega "..." cuando el texto supera el límite', () => {
    const result = truncate('Texto muy largo para truncar', 10)
    expect(result).toHaveLength(13) // 10 + '...'
    expect(result.endsWith('...')).toBe(true)
  })

  it('elimina espacios finales antes de agregar "..."', () => {
    const result = truncate('Hola mundo grande', 9) // "Hola mund" → trim → "Hola mund..."
    expect(result).not.toMatch(/ \.\.\./)
  })

  it('trunca correctamente en límite=0', () => {
    const result = truncate('Algo de texto', 0)
    expect(result).toBe('...')
  })
})

// ─── cn ───────────────────────────────────────────────────────────────────────

describe('cn()', () => {
  it('combina múltiples clases en una cadena', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz')
  })

  it('ignora valores falsy (undefined, false, null)', () => {
    expect(cn('foo', undefined, 'bar', false, null, 'baz')).toBe('foo bar baz')
  })

  it('devuelve cadena vacía cuando todos los valores son falsy', () => {
    expect(cn(undefined, false, null)).toBe('')
  })

  it('funciona con un solo argumento', () => {
    expect(cn('solo')).toBe('solo')
  })

  it('devuelve cadena vacía sin argumentos', () => {
    expect(cn()).toBe('')
  })
})

// ─── issuuCoverUrl ─────────────────────────────────────────────────────────────

describe('issuuCoverUrl()', () => {
  it('redirige URLs de image.isu.pub a través del proxy local', () => {
    const original = 'https://image.isu.pub/240101/cover.jpg'
    const result = issuuCoverUrl(original)
    expect(result).toBe(`/api/image-proxy?url=${encodeURIComponent(original)}`)
    expect(result.startsWith('/api/image-proxy')).toBe(true)
  })

  it('devuelve la URL sin modificar si no es de image.isu.pub', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
    expect(issuuCoverUrl(url)).toBe(url)
  })

  it('devuelve la URL sin modificar para rutas relativas', () => {
    expect(issuuCoverUrl('/img/cover.jpg')).toBe('/img/cover.jpg')
  })
})

// ─── embedUrlToDirectUrl ───────────────────────────────────────────────────────

describe('embedUrlToDirectUrl()', () => {
  it('convierte URL de embed de Issuu a URL directa', () => {
    const embed = 'https://e.issuu.com/embed.html#d=mi-documento&u=mi-usuario'
    const result = embedUrlToDirectUrl(embed)
    expect(result).toBe('https://issuu.com/mi-usuario/docs/mi-documento')
  })

  it('devuelve la URL original si no tiene los params d y u', () => {
    const url = 'https://example.com/some/path'
    expect(embedUrlToDirectUrl(url)).toBe(url)
  })

  it('devuelve la URL original si la URL es inválida', () => {
    const invalid = 'not-a-url'
    expect(embedUrlToDirectUrl(invalid)).toBe(invalid)
  })

  it('devuelve la URL original si solo tiene el param d pero no u', () => {
    const url = 'https://e.issuu.com/embed.html#d=documento'
    // Sin el parámetro u, la función debe retornar el url original
    expect(embedUrlToDirectUrl(url)).toBe(url)
  })
})
