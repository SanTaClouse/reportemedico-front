'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'

export default function AdminFabButton() {
  const pathname = usePathname()

  if (pathname.startsWith('/admin')) return null

  return (
    <Link
      href="/admin"
      title="Ir al panel de administración"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[var(--color-primary)] text-white text-sm font-medium pl-3 pr-4 py-3 rounded-full shadow-lg hover:brightness-110 transition-all"
    >
      <LayoutDashboard size={16} strokeWidth={1.5} />
      <span>Admin</span>
    </Link>
  )
}
