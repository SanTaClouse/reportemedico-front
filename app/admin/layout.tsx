import { cookies } from 'next/headers'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { Toaster } from 'sonner'
import { getPendingSpecialties } from '@/lib/api'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('rm_token')?.value || ''
  const pendingSpecialties = token
    ? await getPendingSpecialties(token).catch(() => [])
    : []

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-2)]">
      <AdminSidebar pendingTagsBadge={pendingSpecialties.length > 0} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { fontFamily: 'var(--font-dm-sans, sans-serif)' },
        }}
        richColors
        closeButton
      />
    </div>
  )
}
