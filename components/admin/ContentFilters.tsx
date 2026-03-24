'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { Tag } from '@/lib/api'

export default function ContentFilters({ tags }: { tags: Tag[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      params.delete('page')
      router.replace(`/admin/contenido?${params.toString()}`)
    },
    [router, searchParams],
  )

  const selectClass =
    'text-sm border border-[var(--color-border)] rounded-lg px-3 py-1.5 bg-[var(--color-surface)] text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <select
        className={selectClass}
        value={searchParams.get('type') || ''}
        onChange={(e) => update('type', e.target.value)}
      >
        <option value="">Tipo: Todos</option>
        <option value="NEWS">Noticia</option>
        <option value="MEDICAL_ARTICLE">Art. Médico</option>
      </select>

      <select
        className={selectClass}
        value={searchParams.get('status') || ''}
        onChange={(e) => update('status', e.target.value)}
      >
        <option value="">Estado: Todos</option>
        <option value="DRAFT">Borrador</option>
        <option value="PENDING">Pendiente</option>
        <option value="PUBLISHED">Publicado</option>
        <option value="ARCHIVED">Archivado</option>
      </select>

      <select
        className={selectClass}
        value={searchParams.get('relevance') || ''}
        onChange={(e) => update('relevance', e.target.value)}
      >
        <option value="">Relevancia: Todas</option>
        <option value="1">1 — Hero</option>
        <option value="2">2 — Lead</option>
        <option value="3">3 — Big Destacada</option>
        <option value="4">4 — Small Destacada</option>
        <option value="5">5 — Actualidad</option>
        <option value="null">Sin slot editorial</option>
      </select>

      {tags.length > 0 && (
        <select
          className={selectClass}
          value={searchParams.get('tag') || ''}
          onChange={(e) => update('tag', e.target.value)}
        >
          <option value="">Tag: Todos</option>
          {tags.map((t) => (
            <option key={t.id} value={t.slug}>{t.name}</option>
          ))}
        </select>
      )}

      <select
        className={selectClass}
        value={searchParams.get('sort') || 'createdAt_desc'}
        onChange={(e) => update('sort', e.target.value)}
      >
        <option value="createdAt_desc">Más recientes</option>
        <option value="publishedAt_desc">Por publicación</option>
        <option value="relevance_asc">Por relevancia</option>
        <option value="views_desc">Más vistos</option>
      </select>
    </div>
  )
}
