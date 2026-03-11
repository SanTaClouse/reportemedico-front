export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getAdminPodcastEpisodes } from '@/lib/api'
import PodcastClient from './PodcastClient'

export default async function AdminPodcastPage() {
  const cookieStore = cookies()
  const token = cookieStore.get('rm_token')?.value || ''

  const episodes = await getAdminPodcastEpisodes(token).catch(() => [])

  return <PodcastClient episodes={episodes} token={token} />
}
