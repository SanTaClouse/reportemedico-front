export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getAdminArticleById, getTags, getRelevanceCounts } from '@/lib/api'
import dynamicImport from 'next/dynamic'
import { EditorSkeleton } from '@/components/admin/EditorSkeleton'
import ArticleEmailSender from '@/components/admin/ArticleEmailSender'
import { Mail } from 'lucide-react'

const ArticleEditor = dynamicImport(
  () => import('@/components/admin/ArticleEditor'),
  { ssr: false, loading: () => <EditorSkeleton /> },
)

interface Props {
  params: { id: string }
}

export default async function EditarArticuloPage({ params }: Props) {
  const cookieStore = cookies()
  const token = cookieStore.get('rm_token')?.value || ''

  const [article, tags, relevanceCounts] = await Promise.all([
    getAdminArticleById(params.id, token).catch(() => null),
    getTags().catch(() => []),
    getRelevanceCounts(token).catch(() => ({} as Record<number, number>)),
  ])

  if (!article) return notFound()

  const authorEmail = (article as any).authorEmail as string | null | undefined

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)] mb-6">
        Editar artículo
      </h1>

      {/* Aviso de notificación manual al doctor */}
      {authorEmail && (article as any).status === 'PUBLISHED' && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3.5 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/15 dark:border-blue-800">
          <Mail size={18} strokeWidth={1.5} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
              Notificar al autor manualmente
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
              Este artículo fue publicado y el autor dejó su email. Avisale que ya está en línea.
            </p>
            <a
              href={`mailto:${authorEmail}?subject=Tu artículo fue publicado en Reporte Médico&body=Hola ${(article as any).authorName},%0A%0ATu artículo "${(article as any).title}" fue publicado en Reporte Médico.%0A%0ASaludos.`}
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline"
            >
              <Mail size={12} />
              {authorEmail}
            </a>
          </div>
        </div>
      )}

      {authorEmail && (article as any).status === 'ARCHIVED' && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3.5 rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-900/15 dark:border-orange-800">
          <Mail size={18} strokeWidth={1.5} className="text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
              Notificar al autor manualmente
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-400 mt-0.5">
              Este artículo fue archivado. Si quieres, puedes notificarle al autor.
            </p>
            <a
              href={`mailto:${authorEmail}?subject=Actualización sobre tu artículo - Reporte Médico`}
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-orange-700 dark:text-orange-300 hover:underline"
            >
              <Mail size={12} />
              {authorEmail}
            </a>
          </div>
        </div>
      )}

      {/* Envío de la noticia por correo a suscriptores (08 §1) */}
      {(article as any).status === 'PUBLISHED' && (
        <ArticleEmailSender articleId={params.id} token={token} />
      )}

      <ArticleEditor
        token={token}
        tags={tags}
        mode="edit"
        articleId={params.id}
        articleType={(article as any).type}
        initialData={article}
        relevanceCounts={relevanceCounts}
      />
    </div>
  )
}
