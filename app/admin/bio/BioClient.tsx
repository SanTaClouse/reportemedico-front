'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Link2, Plus, Trash2, Loader2, X, Pencil, ExternalLink,
  ToggleLeft, ToggleRight, ChevronUp, ChevronDown, GripVertical,
  Eye, MousePointerClick, Percent, BarChart3, Calendar, ImageIcon, Save,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  updateBioPage, createBioLink, updateBioLink, deleteBioLink, reorderBioLinks, getBioStats,
  type BioAdminPage, type BioAdminLink, type BioStats, type BioLinkInput,
} from '@/lib/api-bio'
import { uploadImagenNoticia } from '@/lib/api'
import { bioIcon, BIO_ICON_OPTIONS } from '@/lib/bio-icons'

interface Props {
  initialPage: BioAdminPage | null
  initialStats: BioStats | null
  token: string
}

const inputClass =
  'w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-[var(--color-surface)] text-[var(--color-text-primary)]'
const labelClass = 'block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1'

const URL_RE = /^(https?:\/\/|mailto:|tel:)/i
const RANGES = [7, 30, 90]

type LinkForm = {
  label: string
  url: string
  icon: string
  isActive: boolean
  startsAt: string
  endsAt: string
}
const EMPTY_LINK: LinkForm = { label: '', url: '', icon: 'link', isActive: true, startsAt: '', endsAt: '' }

export default function BioClient({ initialPage, initialStats, token }: Props) {
  const [page, setPage] = useState<BioAdminPage | null>(initialPage)
  const [links, setLinks] = useState<BioAdminLink[]>(initialPage?.links ?? [])

  // Ajustes de la página
  const [title, setTitle] = useState(initialPage?.title ?? '')
  const [subtitle, setSubtitle] = useState(initialPage?.subtitle ?? '')
  const [avatarUrl, setAvatarUrl] = useState(initialPage?.avatarUrl ?? '')
  const [isActive, setIsActive] = useState(initialPage?.isActive ?? true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Modal de enlace
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [editing, setEditing] = useState<BioAdminLink | null>(null)
  const [form, setForm] = useState<LinkForm>(EMPTY_LINK)
  const [showSchedule, setShowSchedule] = useState(false)
  const [savingLink, setSavingLink] = useState(false)

  // Estadísticas
  const [stats, setStats] = useState<BioStats | null>(initialStats)
  const [range, setRange] = useState(30)
  const [loadingStats, setLoadingStats] = useState(false)

  if (!page) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Bio</h1>
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          No se pudo cargar la página de bio. Verificá que el backend esté corriendo y que el seed haya creado la página.
        </p>
      </div>
    )
  }

  // ─── AJUSTES ──────────────────────────────────────────

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const { url } = await uploadImagenNoticia(file, token)
      setAvatarUrl(url)
      toast.success('Avatar subido — recordá guardar')
    } catch (err: any) {
      toast.error(err.message || 'Error al subir el avatar')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const saveSettings = async () => {
    if (!title.trim()) return toast.error('El título es obligatorio')
    setSavingSettings(true)
    try {
      await updateBioPage(token, {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        isActive,
      })
      toast.success('Ajustes guardados')
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar')
    } finally {
      setSavingSettings(false)
    }
  }

  // ─── ENLACES ──────────────────────────────────────────

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY_LINK)
    setShowSchedule(false)
    setShowLinkForm(true)
  }

  const openEdit = (link: BioAdminLink) => {
    setEditing(link)
    setForm({
      label: link.label,
      url: link.url,
      icon: link.icon || 'link',
      isActive: link.isActive,
      startsAt: toLocalInput(link.startsAt),
      endsAt: toLocalInput(link.endsAt),
    })
    setShowSchedule(Boolean(link.startsAt || link.endsAt))
    setShowLinkForm(true)
  }

  const saveLink = async () => {
    if (!form.label.trim()) return toast.error('El texto del enlace es obligatorio')
    if (!URL_RE.test(form.url.trim())) return toast.error('El enlace debe empezar con http(s)://, mailto: o tel:')

    const payload: BioLinkInput = {
      label: form.label.trim(),
      url: form.url.trim(),
      icon: form.icon || null,
      isActive: form.isActive,
    }
    if (editing) {
      payload.startsAt = form.startsAt ? new Date(form.startsAt).toISOString() : null
      payload.endsAt = form.endsAt ? new Date(form.endsAt).toISOString() : null
    } else {
      if (form.startsAt) payload.startsAt = new Date(form.startsAt).toISOString()
      if (form.endsAt) payload.endsAt = new Date(form.endsAt).toISOString()
    }

    setSavingLink(true)
    try {
      if (editing) {
        const updated = await updateBioLink(token, editing.id, payload)
        setLinks((ls) => ls.map((l) => (l.id === updated.id ? updated : l)))
        toast.success('Enlace actualizado')
      } else {
        const created = await createBioLink(token, payload)
        setLinks((ls) => [...ls, created])
        toast.success('Enlace agregado')
      }
      setShowLinkForm(false)
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar el enlace')
    } finally {
      setSavingLink(false)
    }
  }

  const toggleLink = async (link: BioAdminLink) => {
    // Optimista
    setLinks((ls) => ls.map((l) => (l.id === link.id ? { ...l, isActive: !l.isActive } : l)))
    try {
      await updateBioLink(token, link.id, { isActive: !link.isActive })
    } catch (err: any) {
      setLinks((ls) => ls.map((l) => (l.id === link.id ? { ...l, isActive: link.isActive } : l)))
      toast.error(err.message || 'Error al cambiar el estado')
    }
  }

  const removeLink = async (link: BioAdminLink) => {
    if (!confirm(`¿Eliminar el enlace "${link.label}"?`)) return
    const prev = links
    setLinks((ls) => ls.filter((l) => l.id !== link.id))
    try {
      await deleteBioLink(token, link.id)
      toast.success('Enlace eliminado')
    } catch (err: any) {
      setLinks(prev)
      toast.error(err.message || 'Error al eliminar')
    }
  }

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= links.length) return
    const next = [...links]
    ;[next[index], next[target]] = [next[target], next[index]]
    setLinks(next)
    try {
      await reorderBioLinks(token, next.map((l) => l.id))
    } catch (err: any) {
      setLinks(links)
      toast.error(err.message || 'Error al reordenar')
    }
  }

  // ─── ESTADÍSTICAS ─────────────────────────────────────

  const changeRange = async (r: number) => {
    if (r === range) return
    setRange(r)
    setLoadingStats(true)
    try {
      setStats(await getBioStats(token, r))
    } catch {
      toast.error('No se pudieron cargar las métricas')
    } finally {
      setLoadingStats(false)
    }
  }

  const maxLinkClicks = Math.max(1, ...(stats?.links.map((l) => l.clicks) ?? [0]))

  return (
    <div className="max-w-5xl space-y-8 p-6 md:p-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-[var(--color-text-primary)]">
            <Link2 size={22} strokeWidth={1.75} className="text-[var(--color-primary)]" /> Bio
          </h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            Tu página de enlaces · <span className="font-medium">reportemedico.com/bio</span>
          </p>
        </div>
        <a
          href="/bio"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 self-start rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          Ver página <ExternalLink size={15} />
        </a>
      </div>

      {/* ── Métricas ── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
            <BarChart3 size={14} /> Métricas · últimos {range} días
          </h2>
          <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => changeRange(r)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  r === range
                    ? 'bg-primary-pale text-primary'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>

        {stats ? (
          <div className={loadingStats ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={<Eye size={18} strokeWidth={1.5} />} value={stats.views} label="Vistas" color="blue" sub={`${stats.viewsAllTime} histórico`} />
              <StatCard icon={<MousePointerClick size={18} strokeWidth={1.5} />} value={stats.clicks} label="Clics" color="gold" sub={`${stats.clicksAllTime} histórico`} />
              <StatCard icon={<Percent size={18} strokeWidth={1.5} />} value={`${stats.ctr}%`} label="CTR" color="green" sub="clics / vistas" />
              <StatCard icon={<Link2 size={18} strokeWidth={1.5} />} value={links.length} label="Enlaces" color="gray" sub={`${links.filter((l) => l.isActive).length} activos`} />
            </div>

            <MiniChart series={stats.series} />

            {/* Ranking por enlace */}
            <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Clics por enlace
              </p>
              {stats.links.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">Sin enlaces todavía.</p>
              ) : (
                <ul className="space-y-2.5">
                  {stats.links.map((l) => {
                    const Icon = bioIcon(l.icon)
                    return (
                      <li key={l.id} className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]">
                          <Icon size={14} strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className={`truncate text-sm ${l.isActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)] line-through'}`}>
                              {l.label}
                            </span>
                            <span className="shrink-0 text-sm font-semibold text-[var(--color-text-primary)]">{l.clicks}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                            <div
                              className="h-full rounded-full bg-[var(--brand-gold)]"
                              style={{ width: `${(l.clicks / maxLinkClicks) * 100}%` }}
                            />
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)]">
            No se pudieron cargar las métricas.
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* ── Enlaces ── */}
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Enlaces</h2>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-light"
            >
              <Plus size={14} /> Agregar
            </button>
          </div>

          {links.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-muted)]">
              No hay enlaces. Agregá el primero.
            </div>
          ) : (
            <ul className="space-y-2">
              {links.map((link, i) => {
                const Icon = bioIcon(link.icon)
                return (
                  <li
                    key={link.id}
                    className={`flex items-center gap-3 rounded-xl border bg-[var(--color-surface)] p-3 transition-colors ${
                      link.isActive ? 'border-[var(--color-border)]' : 'border-[var(--color-border)] opacity-60'
                    }`}
                  >
                    <div className="flex flex-col">
                      <button onClick={() => move(i, -1)} disabled={i === 0} className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] disabled:opacity-25" aria-label="Subir">
                        <ChevronUp size={15} />
                      </button>
                      <GripVertical size={15} className="text-[var(--color-border)]" />
                      <button onClick={() => move(i, 1)} disabled={i === links.length - 1} className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] disabled:opacity-25" aria-label="Bajar">
                        <ChevronDown size={15} />
                      </button>
                    </div>

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-primary)]">
                      <Icon size={17} strokeWidth={1.75} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{link.label}</p>
                      <p className="truncate text-xs text-[var(--color-text-muted)]">{link.url}</p>
                    </div>

                    <button onClick={() => toggleLink(link)} aria-label="Activar/desactivar" className="shrink-0">
                      {link.isActive
                        ? <ToggleRight size={26} className="text-[var(--color-success)]" />
                        : <ToggleLeft size={26} className="text-[var(--color-text-muted)]" />}
                    </button>
                    <button onClick={() => openEdit(link)} aria-label="Editar" className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => removeLink(link)} aria-label="Eliminar" className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-breaking)]">
                      <Trash2 size={16} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* ── Ajustes de la página ── */}
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Apariencia</h2>
          <div className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
                    <ImageIcon size={20} />
                  </div>
                )}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
                {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                {avatarUrl ? 'Cambiar avatar' : 'Subir avatar'}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>

            <div>
              <label className={labelClass}>Título</label>
              <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
            </div>
            <div>
              <label className={labelClass}>Subtítulo</label>
              <input className={inputClass} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} maxLength={160} placeholder="Una línea bajo el título" />
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-[var(--color-surface-2)] px-3 py-2.5">
              <span className="text-sm text-[var(--color-text-secondary)]">Página visible</span>
              <button onClick={() => setIsActive((v) => !v)} type="button" aria-label="Visible">
                {isActive
                  ? <ToggleRight size={28} className="text-[var(--color-success)]" />
                  : <ToggleLeft size={28} className="text-[var(--color-text-muted)]" />}
              </button>
            </label>

            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
            >
              {savingSettings ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar ajustes
            </button>
          </div>
        </section>
      </div>

      {/* ── Modal de enlace ── */}
      {showLinkForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowLinkForm(false)}>
          <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface)] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[var(--color-text-primary)]">
                {editing ? 'Editar enlace' : 'Nuevo enlace'}
              </h3>
              <button onClick={() => setShowLinkForm(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Texto</label>
                <input className={inputClass} value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} maxLength={120} placeholder="Agenda tu cita por WhatsApp" autoFocus />
              </div>
              <div>
                <label className={labelClass}>Enlace (URL)</label>
                <input className={inputClass} value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <label className={labelClass}>Ícono</label>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-primary)]">
                    {(() => { const I = bioIcon(form.icon); return <I size={17} strokeWidth={1.75} /> })()}
                  </span>
                  <select className={inputClass} value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}>
                    {BIO_ICON_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-sm text-[var(--color-text-secondary)]">Enlace activo</span>
                <button type="button" onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))} aria-label="Activo">
                  {form.isActive
                    ? <ToggleRight size={28} className="text-[var(--color-success)]" />
                    : <ToggleLeft size={28} className="text-[var(--color-text-muted)]" />}
                </button>
              </label>

              <button
                type="button"
                onClick={() => setShowSchedule((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary)] hover:underline"
              >
                <Calendar size={13} /> {showSchedule ? 'Ocultar programación' : 'Programar (opcional)'}
              </button>
              {showSchedule && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Desde</label>
                    <input type="datetime-local" className={inputClass} value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Hasta</label>
                    <input type="datetime-local" className={inputClass} value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowLinkForm(false)} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]">
                Cancelar
              </button>
              <button
                onClick={saveLink}
                disabled={savingLink}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-60"
              >
                {savingLink ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-componentes ─────────────────────────────────────

function StatCard({ icon, value, label, sub, color }: {
  icon: React.ReactNode
  value: number | string
  label: string
  sub?: string
  color: 'blue' | 'gold' | 'green' | 'gray'
}) {
  const colors = {
    blue: { bar: 'bg-[var(--brand-electric)]', text: 'text-[var(--brand-electric)]' },
    gold: { bar: 'bg-[var(--brand-gold)]', text: 'text-[var(--brand-gold)]' },
    green: { bar: 'bg-[var(--color-success)]', text: 'text-[var(--color-success)]' },
    gray: { bar: 'bg-[var(--color-text-muted)]', text: 'text-[var(--color-text-muted)]' },
  }[color]
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className={`absolute bottom-0 left-0 top-0 w-1 ${colors.bar}`} />
      <div className={`mb-2 ${colors.text}`}>{icon}</div>
      <p className="mb-0.5 text-2xl font-bold leading-none text-[var(--color-text-primary)]">{value}</p>
      <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      {sub && <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">{sub}</p>}
    </div>
  )
}

function MiniChart({ series }: { series: { date: string; views: number; clicks: number }[] }) {
  const max = Math.max(1, ...series.map((d) => d.views))
  return (
    <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <span className="h-2.5 w-2.5 rounded-sm bg-[var(--brand-electric)]/40" /> Vistas
        </span>
        <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <span className="h-2.5 w-2.5 rounded-sm bg-[var(--brand-gold)]" /> Clics
        </span>
      </div>
      <div className="flex h-28 items-end gap-px">
        {series.map((d) => (
          <div key={d.date} className="group relative flex-1" title={`${d.date} · ${d.views} vistas · ${d.clicks} clics`}>
            <div className="relative h-28 w-full">
              <div
                className="absolute bottom-0 w-full rounded-t-sm bg-[var(--brand-electric)]/30"
                style={{ height: `${(d.views / max) * 100}%` }}
              />
              <div
                className="absolute bottom-0 w-full rounded-t-sm bg-[var(--brand-gold)]"
                style={{ height: `${(d.clicks / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
