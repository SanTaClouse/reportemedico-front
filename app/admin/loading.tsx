export default function AdminLoading() {
  return (
    <div className="p-6">
      {/* Page title */}
      <div className="skeleton h-7 w-48 rounded mb-6" />

      {/* Tabla skeleton */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {/* Header */}
        <div
          className="flex gap-4 p-4"
          style={{ background: 'var(--color-surface-2)' }}
        >
          {[40, 15, 15, 15, 15].map((w, i) => (
            <div
              key={i}
              className="skeleton h-4 rounded"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 p-4 border-t"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {[40, 15, 15, 15, 15].map((w, j) => (
              <div
                key={j}
                className="skeleton h-4 rounded"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
