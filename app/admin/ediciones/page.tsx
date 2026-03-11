export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getAdminPrintEditions } from '@/lib/api'
import EdicionesClient from './EdicionesClient'

export default async function AdminEdicionesPage() {
  const cookieStore = cookies()
  const token = cookieStore.get('rm_token')?.value || ''

  const editions = await getAdminPrintEditions(token).catch(() => [])

  return <EdicionesClient editions={editions} token={token} />
}
