import { cookies } from 'next/headers'
import { getTags } from '@/lib/api'
import ArticleEditor from '@/components/admin/ArticleEditor'

export default async function NuevaNoticiaPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('rm_token')?.value || ''
  const tags = await getTags().catch(() => [])

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)] mb-6">
        Nueva Noticia
      </h1>
      <ArticleEditor token={token} tags={tags} mode="create" articleType="NEWS" />
    </div>
  )
}
