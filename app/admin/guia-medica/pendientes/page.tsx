export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getDoctorsAdmin } from '@/lib/api-guia'
import PendientesClient from './PendientesClient'

export default async function PendientesGuiaPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('rm_token')?.value || ''
  const data = await getDoctorsAdmin({ status: 'PENDING', limit: 100 }, token).catch(() => ({
    items: [], total: 0, page: 1, limit: 100,
  }))

  return <PendientesClient initialDoctors={data.items} token={token} />
}
