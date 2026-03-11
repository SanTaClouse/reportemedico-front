export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getAdminArticleById, getTags } from '@/lib/api'
import ArticleEditor from '@/components/admin/ArticleEditor'

interface Props {
  params: { id: string }
}

export default async function EditarArticuloPage({ params }: Props) {
  const cookieStore = cookies()
  const token = cookieStore.get('rm_token')?.value || ''

  const [article, tags] = await Promise.all([
    getAdminArticleById(params.id, token).catch(() => null),
    getTags().catch(() => []),
  ])

  if (!article) return notFound()

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)] mb-6">
        Editar artículo
      </h1>
      <ArticleEditor
        token={token}
        tags={tags}
        mode="edit"
        articleId={params.id}
        articleType={(article as any).type}
        initialData={article}
      />
    </div>
  )
}
