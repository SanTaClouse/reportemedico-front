export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getTagsAdmin } from '@/lib/api'
import TagsClient from './TagsClient'

export default async function AdminTagsPage() {
  const cookieStore = cookies()
  const token = cookieStore.get('rm_token')?.value || ''
  const tags = await getTagsAdmin(token).catch(() => [])

  return <TagsClient initialTags={tags} token={token} />
}
