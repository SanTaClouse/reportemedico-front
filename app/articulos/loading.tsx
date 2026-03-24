import SkeletonCard from '@/components/ui/SkeletonCard'

export default function ArticlesLoading() {
  return (
    <div className="max-w-site mx-auto px-4 md:px-6 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="skeleton h-8 w-52 rounded mb-2" />
        <div className="skeleton h-1 w-12 rounded" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} variant="principal" />
        ))}
      </div>
    </div>
  )
}
