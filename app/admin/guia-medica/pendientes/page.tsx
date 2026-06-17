export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getDoctorsAdmin, getReverifyDoctors } from '@/lib/api-guia'
import PendientesClient from './PendientesClient'

export default async function PendientesGuiaPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('rm_token')?.value || ''
  const [data, reverify] = await Promise.all([
    getDoctorsAdmin({ status: 'PENDING', limit: 100 }, token).catch(() => ({
      items: [], total: 0, page: 1, limit: 100,
    })),
    getReverifyDoctors(token).catch(() => []),
  ])

  return <PendientesClient initialDoctors={data.items} reverifyDoctors={reverify} token={token} />
}
