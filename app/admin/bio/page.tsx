export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getBioAdmin, getBioStats } from '@/lib/api-bio'
import BioClient from './BioClient'

export default async function AdminBioPage() {
  const cookieStore = cookies()
  const token = cookieStore.get('rm_token')?.value || ''

  const [page, stats] = await Promise.all([
    getBioAdmin(token).catch(() => null),
    getBioStats(token, 30).catch(() => null),
  ])

  return <BioClient initialPage={page} initialStats={stats} token={token} />
}
