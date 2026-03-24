export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getTagsAdmin, getPendingSpecialties } from '@/lib/api'
import TagsClient from './TagsClient'

export default async function AdminTagsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('rm_token')?.value || ''
  const [tags, pendingSpecialties] = await Promise.all([
    getTagsAdmin(token).catch(() => []),
    getPendingSpecialties(token).catch(() => []),
  ])

  return <TagsClient initialTags={tags} initialPendingSpecialties={pendingSpecialties} token={token} />
}
