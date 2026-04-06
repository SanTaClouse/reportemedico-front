import type { Metadata } from 'next'
import Link from 'next/link'
import { getTags } from '@/lib/api'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Categorías',
  description: 'Explorá todas las categorías de Reporte Médico.',
  alternates: { canonical: '/categorias' },
  openGraph: {
    title: 'Categorías | Reporte Médico',
    description: 'Explorá todas las categorías de Reporte Médico.',
    url: '/categorias',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Categorías | Reporte Médico',
    description: 'Explorá todas las categorías de Reporte Médico.',
  },
}

const CARD_COLORS = [
  'from-[#0A7B4B] to-[#055c38]',
  'from-[#00B4A0] to-[#007a6e]',
  'from-[#001450] to-[#002a9e]',
  'from-[#c9920a] to-[#9a6f07]',
  'from-[#2563eb] to-[#1d4ed8]',
  'from-[#7c3aed] to-[#5b21b6]',
  'from-[#dc2626] to-[#b91c1c]',
  'from-[#0891b2] to-[#0e7490]',
]

export default async function CategoriasPage() {
  const tags = await getTags().catch(() => [])

  return (
    <div className="max-w-site mx-auto px-4 md:px-6 py-10">
      <h1 className="font-display font-bold text-4xl text-[var(--color-text-primary)] mb-2">
        Categorías
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-8">
        Explorá el contenido por especialidad o tema
      </p>

      {tags.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-center py-16">
          No hay categorías disponibles.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {tags.map((tag, i) => (
            <Link
              key={tag.id}
              href={`/tag/${tag.slug}`}
              className={`relative flex items-end rounded-2xl bg-gradient-to-br ${CARD_COLORS[i % CARD_COLORS.length]} p-5 aspect-[4/3] group overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
            >
              {/* Decoración de fondo */}
              <div className="absolute top-3 right-3 w-16 h-16 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-500 ease-out" />
              <div className="absolute top-8 right-8 w-8 h-8 rounded-full bg-white/10" />

              <div className="relative z-10">
                <h2 className="font-display font-bold text-white text-lg leading-tight capitalize">
                  {tag.name}
                </h2>
                <p className="text-white/60 text-xs mt-1 group-hover:text-white/90 transition-colors">
                  Ver artículos →
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
