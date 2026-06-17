export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getEngagement } from '@/lib/api-guia'
import ActividadClient from './ActividadClient'

export default async function AdminActividadPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('rm_token')?.value || ''
  const rows = await getEngagement(token).catch(() => [])
  return <ActividadClient rows={rows} />
}
