'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Clock,
  Tag,
  BookOpen,
  Mic,
  Image,
  LogOut,
  Users,
  Megaphone,
  Mail,
  Stethoscope,
  ClipboardList,
  FolderTree,
} from 'lucide-react'

const BASE_NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/contenido', label: 'Contenido', icon: FileText },
  { href: '/admin/articulos-pendientes', label: 'Pendientes', icon: Clock, badge: true },
  { href: '/admin/tags', label: 'Tags', icon: Tag, badgeKey: 'tags' as const },
  { href: '/admin/ediciones', label: 'Ediciones', icon: BookOpen },
  { href: '/admin/podcast', label: 'Podcast', icon: Mic },
  { href: '/admin/consejo-medico', label: 'Consejo Médico', icon: Users },
  { href: '/admin/suscriptores', label: 'Suscriptores', icon: Mail },
  { href: '/admin/media', label: 'Media', icon: Image },
  { href: '/admin/publicidad', label: 'Publicidad', icon: Megaphone },
]

// V2 — Guía Médica
const GUIA_NAV_ITEMS = [
  { href: '/admin/guia-medica/medicos', label: 'Médicos', icon: Stethoscope },
  { href: '/admin/guia-medica/pendientes', label: 'Aprobaciones', icon: ClipboardList, badgeKey: 'doctors' as const },
  { href: '/admin/guia-medica/catalogos', label: 'Catálogos', icon: FolderTree },
  { href: '/admin/guia-medica/textos', label: 'Textos SEO', icon: FileText },
]

interface AdminSidebarProps {
  pendingTagsBadge?: boolean
  pendingDoctorsCount?: number
}

export default function AdminSidebar({ pendingTagsBadge = false, pendingDoctorsCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/set-cookie', { method: 'DELETE' })
    router.push('/admin/login')
  }

  return (
    <aside className="w-60 min-h-screen bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col">
      <div className="p-5 border-b border-[var(--color-border)]">
        <p className="font-display font-bold text-base text-[var(--color-primary)]">
          Reporte Médico
        </p>
        <p className="text-[11px] text-[var(--color-text-muted)]">Panel Admin</p>
      </div>

      <nav className="flex-1 py-4">
        <ul className="space-y-0.5 px-2">
          {BASE_NAV_ITEMS.map(({ href, label, icon: Icon, badge, badgeKey }) => {
            const isActive = pathname.startsWith(href)
            const showBadge = badge || (badgeKey === 'tags' && pendingTagsBadge)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-pale text-primary'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  <span className="flex-1">{label}</span>
                  {showBadge && (
                    <span className="w-2 h-2 rounded-full bg-breaking" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        <p className="px-5 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Guía Médica
        </p>
        <ul className="space-y-0.5 px-2">
          {GUIA_NAV_ITEMS.map(({ href, label, icon: Icon, badgeKey }) => {
            const isActive = pathname.startsWith(href)
            const showCount = badgeKey === 'doctors' && pendingDoctorsCount > 0
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-pale text-primary'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  <span className="flex-1">{label}</span>
                  {showCount && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-breaking text-white text-[11px] font-semibold flex items-center justify-center">
                      {pendingDoctorsCount}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-[var(--color-border)]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} strokeWidth={1.5} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
