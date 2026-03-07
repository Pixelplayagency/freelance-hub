import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-7 w-56 mb-6" />
      <div className="flex gap-4 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col min-w-[260px]">
            <Skeleton className="h-5 w-20 mb-3" />
            <div className="space-y-2">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-24 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
