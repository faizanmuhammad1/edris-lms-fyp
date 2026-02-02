import { CourseGridSkeleton } from "@/components/ui/course-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicLoading() {
    return (
        <main className="flex min-h-screen flex-col">
            {/* Hero Section Skeleton */}
            <section className="relative py-24 px-4 md:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30">
                <div className="container mx-auto text-center space-y-6">
                    <Skeleton className="h-6 w-32 mx-auto rounded-full" />
                    <Skeleton className="h-12 w-96 max-w-full mx-auto" />
                    <Skeleton className="h-6 w-[500px] max-w-full mx-auto" />
                    <div className="flex justify-center gap-4 pt-4">
                        <Skeleton className="h-12 w-36 rounded-md" />
                        <Skeleton className="h-12 w-36 rounded-md" />
                    </div>
                </div>
            </section>

            {/* Categories Section Skeleton */}
            <section className="py-16 px-4 md:px-6 lg:px-8">
                <div className="container mx-auto space-y-8">
                    <div className="text-center space-y-2">
                        <Skeleton className="h-8 w-48 mx-auto" />
                        <Skeleton className="h-4 w-72 mx-auto" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 rounded-xl" />
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Courses Skeleton */}
            <section className="py-16 px-4 md:px-6 lg:px-8 bg-muted/20">
                <div className="container mx-auto space-y-8">
                    <div className="flex justify-between items-end">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-32 rounded-full" />
                            <Skeleton className="h-10 w-64" />
                            <Skeleton className="h-4 w-96 max-w-full" />
                        </div>
                        <Skeleton className="h-10 w-36 rounded-md" />
                    </div>
                    <CourseGridSkeleton count={8} />
                </div>
            </section>
        </main>
    );
}
