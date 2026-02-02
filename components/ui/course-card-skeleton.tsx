import { Skeleton } from "@/components/ui/skeleton";

export function CourseCardSkeleton() {
    return (
        <div className="rounded-xl border bg-card overflow-hidden">
            {/* Image placeholder */}
            <Skeleton className="aspect-video w-full" />

            {/* Content */}
            <div className="p-5 space-y-4">
                {/* Meta badges */}
                <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>

                {/* Price and CTA */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-9 w-24 rounded-md" />
                </div>
            </div>
        </div>
    );
}

export function CourseGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <CourseCardSkeleton key={i} />
            ))}
        </div>
    );
}
