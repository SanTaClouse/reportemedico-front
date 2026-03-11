import type { Metadata } from 'next'
import ArticleSubmitForm from '@/components/forms/ArticleSubmitForm'
import { getTags } from '@/lib/api'

export const metadata: Metadata = {
  title: 'Publicar Artículo Médico',
  description: 'Envía tu artículo médico para publicación en Reporte Médico.',
}

export default async function NuevoArticuloPage() {
  const tags = await getTags().catch(() => [])

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
      <h1 className="font-display font-bold text-3xl text-[var(--color-text-primary)] mb-2">
        Publicar Artículo Médico
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-8">
        Completa el formulario y nuestro equipo revisará tu artículo para publicación.
      </p>

      <ArticleSubmitForm tags={tags} />
    </div>
  )
}
