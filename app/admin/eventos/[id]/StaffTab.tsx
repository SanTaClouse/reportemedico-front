'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { KeyRound, Loader2, UserPlus, Wand2 } from 'lucide-react'
import { SITE_URL, createStaff, updateStaff, type StaffUser } from '@/lib/api-eventos'

/** Contraseña legible para dictar por teléfono: sin 0/O ni 1/l */
function generatePassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

export default function StaffTab({ staff, token }: { staff: StaffUser[]; token: string }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createStaff(form, token)
      toast.success(`Usuario creado. Entra con ${form.email} y la contraseña que definiste.`)
      setForm({ name: '', email: '', password: '' })
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const patch = async (u: StaffUser, data: { isActive?: boolean; password?: string }) => {
    setBusyId(u.id)
    try {
      await updateStaff(u.id, data, token)
      if (data.password) toast.success(`Nueva contraseña de ${u.email}: ${data.password}`, { duration: 20000 })
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const input =
    'w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]'

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
      <div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Estas cuentas solo pueden usar el <strong>escáner</strong> y la vista en vivo: no ven el panel ni los datos de
          contacto. Entran en <code className="text-xs">{SITE_URL}/admin/login</code> y van directo al escáner.
        </p>

        {staff.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--color-text-muted)]">Todavía no hay personal de puerta.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            {staff.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-4 py-3 flex-wrap">
                <div className="flex-1 min-w-[180px]">
                  <p className={`font-medium ${u.isActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)] line-through'}`}>
                    {u.name ?? u.email}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">{u.email}</p>
                </div>
                <button
                  onClick={() => patch(u, { password: generatePassword() })}
                  disabled={busyId === u.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:border-primary/40"
                >
                  <KeyRound size={13} /> Nueva contraseña
                </button>
                <button
                  onClick={() => patch(u, { isActive: !u.isActive })}
                  disabled={busyId === u.id}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    u.isActive ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {busyId === u.id ? <Loader2 size={13} className="animate-spin" /> : u.isActive ? 'Desactivar' : 'Reactivar'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={create} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
        <p className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
          <UserPlus size={17} strokeWidth={1.5} /> Nuevo usuario de puerta
        </p>
        <input required placeholder="Nombre (se muestra en cada ingreso)" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
        <input required type="email" placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
        <div className="flex gap-2">
          <input required minLength={8} placeholder="Contraseña (mín. 8)" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} className={input} />
          <button type="button" onClick={() => setForm({ ...form, password: generatePassword() })}
            title="Generar contraseña" className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 text-[var(--color-text-secondary)] hover:border-primary/40">
            <Wand2 size={15} />
          </button>
        </div>
        <button type="submit" disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
          {saving && <Loader2 size={15} className="animate-spin" />} Crear usuario
        </button>
      </form>
    </div>
  )
}
