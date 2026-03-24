/**
 * vitest.setup.ts
 *
 * Configuración global de Vitest + Testing Library.
 * Se ejecuta antes de cada archivo de test.
 */

import '@testing-library/jest-dom'
import { vi } from 'vitest'

// ─── Mocks de módulos Next.js ──────────────────────────────────────────────────

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => {
    const React = require('react')
    return React.createElement('a', { href, className }, children)
  },
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, width, height, fill, className, sizes, ...rest }: Record<string, unknown>) => {
    const React = require('react')
    return React.createElement('img', {
      src: src as string,
      alt: alt as string,
      width: width as number,
      height: height as number,
      className: className as string,
      'data-fill': fill ? 'true' : undefined,
      ...rest,
    })
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// ─── Mock de next-themes ───────────────────────────────────────────────────────

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => {
    const React = require('react')
    return React.createElement(React.Fragment, null, children)
  },
}))

// ─── Supresión de errores de consola esperados ─────────────────────────────────

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})
