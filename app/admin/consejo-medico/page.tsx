import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAdminCouncilMembers } from '@/lib/api'
import ConsejoMedicoClient from './ConsejoMedicoClient'

export default async function ConsejoMedicoAdminPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('rm_token')?.value
  if (!token) redirect('/admin/login')

  const members = await getAdminCouncilMembers(token).catch(() => [])

  return <ConsejoMedicoClient initialMembers={members} token={token} />
}
