import { CourseGridSkeleton } from "@/components/ui/course-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl -z-10" />

            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-16 relative z-10">
                {/* Hero Section Skeleton */}
                <div className="flex flex-col space-y-4 mb-12">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-14 w-96 max-w-full" />
                    <Skeleton className="h-6 w-[500px] max-w-full" />
                </div>

                {/* Course Grid Skeleton */}
                <CourseGridSkeleton count={8} />
            </div>
        </div>
    );
}
