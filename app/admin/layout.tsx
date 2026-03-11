import AdminSidebar from '@/components/admin/AdminSidebar'
import { Toaster } from 'sonner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--color-surface-2)]">
      <AdminSidebar />
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
