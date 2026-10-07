import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar Skeleton */}
            <div className="hidden md:flex flex-col w-64 border-r bg-card p-4 space-y-4">
                {/* Logo */}
                <Skeleton className="h-10 w-32" />

                {/* Nav items */}
                <div className="space-y-2 pt-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-md" />
                    ))}
                </div>

                {/* User info at bottom */}
                <div className="mt-auto pt-4 border-t space-y-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-32 rounded-md" />
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    ))}
                </div>

                {/* Content grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
                            <Skeleton className="aspect-video w-full rounded-md" />
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-2 w-full rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function AdminSkeleton() {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <div className="hidden md:flex flex-col w-64 border-r bg-card p-4 space-y-4">
                <Skeleton className="h-10 w-32" />
                <div className="space-y-2 pt-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-md" />
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32 rounded-md" />
                </div>

                {/* Table skeleton */}
                <div className="rounded-xl border bg-card">
                    <div className="p-4 border-b">
                        <Skeleton className="h-10 w-64" />
                    </div>
                    <div className="divide-y">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4">
                                <Skeleton className="h-10 w-10 rounded-md" />
                                <Skeleton className="h-4 flex-1" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-8 w-20 rounded-md" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
