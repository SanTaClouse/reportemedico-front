export default function ArticleLoading() {
  return (
    <div className="max-w-article mx-auto px-4 py-8">
      {/* Tags */}
      <div className="flex gap-2 mb-4">
        <div className="skeleton h-6 w-20 rounded-full" />
        <div className="skeleton h-6 w-24 rounded-full" />
      </div>

      {/* Título */}
      <div className="skeleton h-10 w-full rounded mb-2" />
      <div className="skeleton h-10 w-4/5 rounded mb-6" />

      {/* Meta */}
      <div className="flex gap-4 mb-6">
        <div className="skeleton h-4 w-28 rounded" />
        <div className="skeleton h-4 w-20 rounded" />
      </div>

      {/* Imagen destacada */}
      <div className="skeleton aspect-video w-full rounded-xl mb-8" />

      {/* Cuerpo del artículo */}
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="skeleton h-4 rounded"
            style={{ width: i % 3 === 2 ? '68%' : '100%' }}
          />
        ))}
      </div>
    </div>
  )
}
