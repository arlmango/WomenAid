export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-surface-3 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <SkeletonLine className="mb-3 h-4 w-1/3" />
      <SkeletonLine className="mb-2 h-3 w-full" />
      <SkeletonLine className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonLine className="h-3 w-full" />
        </td>
      ))}
    </tr>
  );
}
