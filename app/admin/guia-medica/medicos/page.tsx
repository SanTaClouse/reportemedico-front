export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getDoctorsAdmin } from '@/lib/api-guia'
import MedicosClient from './MedicosClient'

interface Props {
  searchParams: { status?: string; search?: string; page?: string }
}

export default async function AdminMedicosPage({ searchParams }: Props) {
  const cookieStore = await cookies()
  const token = cookieStore.get('rm_token')?.value || ''
  const data = await getDoctorsAdmin(
    {
      status: searchParams.status,
      search: searchParams.search,
      page: Number(searchParams.page ?? 1),
    },
    token,
  ).catch(() => ({ items: [], total: 0, page: 1, limit: 20 }))

  return <MedicosClient initialData={data} />
}
