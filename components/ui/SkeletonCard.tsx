export default function SkeletonCard({ variant = 'principal' }: { variant?: 'lead' | 'principal' | 'compacta' }) {
  if (variant === 'compacta') {
    return (
      <div className="flex gap-4">
        <div className="skeleton shrink-0 w-20 h-20 rounded-lg" />
        <div className="flex-1 space-y-2 py-1">
          <div className="skeleton h-2.5 w-16 rounded" />
          <div className="skeleton h-4 rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-2.5 w-24 rounded" />
        </div>
      </div>
    )
  }

  if (variant === 'lead') {
    return (
      <div className="flex flex-col h-full rounded-xl overflow-hidden border border-[var(--color-border)]">
        <div className="skeleton flex-1 min-h-[280px]" />
        <div className="p-5 space-y-3">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-6 rounded" />
          <div className="skeleton h-6 w-4/5 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-40 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--color-border)]">
      <div className="skeleton aspect-video" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-5 rounded" />
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-4 w-full rounded mt-1" />
        <div className="skeleton h-3 w-32 rounded mt-1" />
      </div>
    </div>
  )
}
