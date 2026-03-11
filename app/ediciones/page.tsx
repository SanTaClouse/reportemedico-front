import type { Metadata } from 'next'
import Image from 'next/image'
import { BookOpen, ExternalLink } from 'lucide-react'
import { getPrintEditions } from '@/lib/api'
import { formatDate, embedUrlToDirectUrl } from '@/lib/utils'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Ediciones Impresas | Reporte Médico',
  description: 'Lee todas las ediciones impresas de Reporte Médico en formato digital interactivo.',
}

export default async function EdicionesPage() {
  const editions = await getPrintEditions().catch(() => [])
  const [latest, ...archive] = editions

  return (
    <div className="max-w-site mx-auto px-4 md:px-6 py-10">
      <h1 className="font-display font-bold text-4xl text-[var(--color-text-primary)] mb-2">
        Ediciones Impresas
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-10">
        Lee nuestras ediciones en formato digital interactivo
      </p>

      {/* Última edición embebida */}
      {latest && (
        <section className="mb-14">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} strokeWidth={1.5} className="text-[var(--color-primary)]" />
            <h2 className="font-semibold text-[var(--color-text-primary)]">
              Última Edición — {latest.title}
            </h2>
          </div>

          <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-md bg-[var(--color-surface-2)]">
            {/* Issuu embed — usamos el src directamente */}
            <div
              style={{ position: 'relative', paddingTop: 'max(60%, 326px)', height: 0, width: '100%' }}
            >
              <iframe
                allow="clipboard-write"
                sandbox="allow-top-navigation allow-top-navigation-by-user-activation allow-downloads allow-scripts allow-same-origin allow-popups allow-modals allow-popups-to-escape-sandbox allow-forms"
                allowFullScreen
                style={{
                  position: 'absolute',
                  border: 'none',
                  width: '100%',
                  height: '100%',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                }}
                src={latest.issuuUrl}
                title={`Revista Reporte Médico — ${latest.title}`}
              />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)]">
              <span className="text-sm text-[var(--color-text-secondary)]">
                Reporte Médico · {latest.title}
              </span>
              <a
                href={embedUrlToDirectUrl(latest.issuuUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                Abrir en Issuu <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Archivo de ediciones anteriores */}
      {archive.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-2xl text-[var(--color-text-primary)] mb-6">
            Ediciones anteriores
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {archive.map((edition) => (
              <a
                key={edition.id}
                href={embedUrlToDirectUrl(edition.issuuUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="aspect-[3/4] relative rounded-xl overflow-hidden border border-[var(--color-border)] shadow-sm img-hover mb-3">
                  <Image
                    src={edition.coverImage}
                    alt={edition.title}
                    fill
                    className="object-cover group-hover:opacity-90 transition-opacity"
                  />
                </div>
                <p className="font-body font-semibold text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                  {edition.title}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {formatDate(edition.publishedAt)}
                </p>
              </a>
            ))}
          </div>
        </section>
      )}

      {editions.length === 0 && (
        <p className="text-[var(--color-text-muted)] text-center py-20">
          Próximamente las ediciones digitales estarán disponibles aquí.
        </p>
      )}
    </div>
  )
}