import { Skeleton } from "@/components/ui/skeleton";
import { containerClass } from "./_components/SectionHeading";

/** Generic public-page skeleton: a page header followed by a content grid. */
export default function PublicLoading() {
    return (
        <div role="status" aria-label="Loading page">
            <div className="border-b bg-muted/30">
                <div className={`${containerClass} py-16 sm:py-20`}>
                    <div className="max-w-3xl space-y-4">
                        <Skeleton className="h-6 w-40 rounded-full" />
                        <Skeleton className="h-10 w-full max-w-xl sm:h-12" />
                        <Skeleton className="h-10 w-3/4 max-w-md sm:h-12" />
                        <Skeleton className="h-5 w-full max-w-lg" />
                        <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                            <Skeleton className="h-12 w-full rounded-md sm:w-40" />
                            <Skeleton className="h-12 w-full rounded-md sm:w-40" />
                        </div>
                    </div>
                </div>
            </div>

            <div className={`${containerClass} py-16 sm:py-20`}>
                <div className="mb-10 space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-9 w-72 max-w-full" />
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-2xl border bg-card p-6">
                            <Skeleton className="size-12 rounded-xl" />
                            <Skeleton className="mt-6 h-6 w-3/4" />
                            <Skeleton className="mt-3 h-4 w-full" />
                            <Skeleton className="mt-2 h-4 w-5/6" />
                        </div>
                    ))}
                </div>
            </div>
            <span className="sr-only">Loading…</span>
        </div>
    );
}
