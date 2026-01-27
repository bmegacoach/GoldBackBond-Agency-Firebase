export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-6">
      <Skeleton className="h-6 w-1/3 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
