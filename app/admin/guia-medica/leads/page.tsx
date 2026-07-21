export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getDoctorsAdmin, getLeadsAdmin } from '@/lib/api-guia'
import LeadsClient from './LeadsClient'

interface Props {
  searchParams: { view?: string; plan?: string; status?: string; search?: string; page?: string }
}

/**
 * Vista de ventas (pedido de Alberto, 2026-07-21).
 *
 * Dos pestañas:
 *  - "Leads nuevos" (DEFAULT): gente que dejó sus datos y NO terminó de crear
 *    la cuenta. Son los más valiosos — sin esta lista se pierden del todo.
 *  - "Médicos registrados": los que sí tienen cuenta, filtrables por plan
 *    (los básicos son los candidatos a upsell).
 */
export default async function AdminLeadsPage({ searchParams }: Props) {
  const cookieStore = await cookies()
  const token = cookieStore.get('rm_token')?.value || ''
  const view = searchParams.view === 'doctors' ? 'doctors' : 'leads'
  const plan = searchParams.plan ?? 'BASIC'
  const page = Number(searchParams.page ?? 1)

  const [leads, doctors] = await Promise.all([
    view === 'leads'
      ? getLeadsAdmin({ converted: false, page }, token).catch(() => ({
          items: [], total: 0, page: 1, limit: 50,
        }))
      : Promise.resolve({ items: [], total: 0, page: 1, limit: 50 }),
    view === 'doctors'
      ? getDoctorsAdmin(
          {
            plan: plan === 'ALL' ? undefined : plan,
            status: searchParams.status,
            search: searchParams.search,
            page,
            limit: 50,
          },
          token,
        ).catch(() => ({ items: [], total: 0, page: 1, limit: 50 }))
      : Promise.resolve({ items: [], total: 0, page: 1, limit: 50 }),
  ])

  return (
    <LeadsClient
      view={view}
      leads={leads}
      doctors={doctors}
      plan={plan}
      status={searchParams.status ?? ''}
    />
  )
}
