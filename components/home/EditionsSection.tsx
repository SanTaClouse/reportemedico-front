import Image from 'next/image'
import type { PrintEdition } from '@/lib/api'
import SectionTitle from '@/components/ui/SectionTitle'
import Link from 'next/link'

interface EditionsSectionProps {
  editions: PrintEdition[]
}

export default function EditionsSection({ editions }: EditionsSectionProps) {
  return (
    <section className="py-14">
      <div className="max-w-site mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <SectionTitle className="flex-1 mr-4">Ediciones Impresas</SectionTitle>
          <Link
            href="/ediciones"
            className="text-sm font-medium text-[var(--color-primary)] hover:underline whitespace-nowrap"
          >
            Ver todas →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {editions.slice(0, 4).map((edition) => (
            <a
              key={edition.id}
              href={edition.issuuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="aspect-[3/4] relative rounded-lg overflow-hidden border border-[var(--color-border)] shadow-sm img-hover mb-2">
                <Image
                  src={edition.coverImage}
                  alt={edition.title}
                  fill
                  className="object-cover group-hover:opacity-90 transition-opacity"
                />
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] text-center group-hover:text-[var(--color-primary)] transition-colors">
                Ed. {edition.editionNumber}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
