import { Skeleton } from "@/components/ui/skeleton";
import { PublicCourseCardSkeleton } from "../_components/PublicCourseCard";
import { containerClass } from "../_components/SectionHeading";

/** Mirrors the catalog layout: header + search, category chips, results count and card grid. */
export default function CoursesLoading() {
    return (
        <div className="bg-background" role="status" aria-label="Loading courses">
            <div className="border-b bg-muted/30">
                <div className={`${containerClass} py-10 sm:py-14`}>
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="w-full max-w-3xl space-y-3">
                            <Skeleton className="h-10 w-72 max-w-full sm:h-12" />
                            <Skeleton className="h-5 w-[28rem] max-w-full" />
                        </div>
                        <Skeleton className="h-11 w-full rounded-md lg:max-w-sm" />
                    </div>
                </div>
            </div>

            <div className="border-b">
                <div className={`${containerClass} flex gap-2 overflow-hidden py-3`}>
                    {[112, 128, 104, 96, 132, 96, 120].map((width, i) => (
                        <Skeleton key={i} className="h-10 shrink-0 rounded-full" style={{ width }} />
                    ))}
                </div>
            </div>

            <div className={`${containerClass} py-10 sm:py-12`}>
                <Skeleton className="mb-6 h-5 w-32" />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <PublicCourseCardSkeleton key={index} />
                    ))}
                </div>
            </div>
            <span className="sr-only">Loading courses…</span>
        </div>
    );
}
