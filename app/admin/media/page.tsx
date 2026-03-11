export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getAdminMedia } from '@/lib/api'
import MediaClient from './MediaClient'

export default async function AdminMediaPage() {
  const cookieStore = cookies()
  const token = cookieStore.get('rm_token')?.value || ''

  const media = await getAdminMedia(token).catch(() => [])

  return <MediaClient media={media} token={token} />
}
