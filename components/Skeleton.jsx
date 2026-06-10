export function CardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 animate-shimmer-bg">
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 rounded-xl bg-card-secondary shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="w-1/2 h-4 bg-card-secondary rounded" />
          <div className="w-3/4 h-3 bg-card-secondary rounded" />
        </div>
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
