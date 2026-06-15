export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getProgrammaticPairs } from '@/lib/api-guia'
import TextosClient from './TextosClient'

export default async function AdminTextosPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('rm_token')?.value || ''
  const pairs = await getProgrammaticPairs(token).catch(() => [])
  return <TextosClient initialPairs={pairs} token={token} />
}
