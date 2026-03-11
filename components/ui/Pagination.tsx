import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null

  const makeHref = (page: number) =>
    page === 1 ? basePath : `${basePath}?page=${page}`

  return (
    <nav className="flex items-center justify-center gap-2 mt-10">
      {currentPage > 1 && (
        <Link
          href={makeHref(currentPage - 1)}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
        >
          <ChevronLeft size={16} /> Anterior
        </Link>
      )}

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Link
          key={page}
          href={makeHref(page)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
            page === currentPage
              ? 'bg-primary text-white'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-pale)] hover:text-[var(--color-primary)]'
          }`}
        >
          {page}
        </Link>
      ))}

      {currentPage < totalPages && (
        <Link
          href={makeHref(currentPage + 1)}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
        >
          Siguiente <ChevronRight size={16} />
        </Link>
      )}
    </nav>
  )
}
