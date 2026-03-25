export const dynamic = 'force-dynamic'

import dynamic from 'next/dynamic'
import { cookies } from 'next/headers'
import { getTags, getRelevanceCounts } from '@/lib/api'
import { EditorSkeleton } from '@/components/admin/EditorSkeleton'

const ArticleEditor = dynamic(
  () => import('@/components/admin/ArticleEditor'),
  { ssr: false, loading: () => <EditorSkeleton /> },
)

export default async function NuevaNoticiaPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('rm_token')?.value || ''
  const [tags, relevanceCounts] = await Promise.all([
    getTags().catch(() => []),
    getRelevanceCounts(token).catch(() => ({} as Record<number, number>)),
  ])

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)] mb-6">
        Nueva Noticia
      </h1>
      <ArticleEditor token={token} tags={tags} mode="create" articleType="NEWS" relevanceCounts={relevanceCounts} />
    </div>
  )
}
