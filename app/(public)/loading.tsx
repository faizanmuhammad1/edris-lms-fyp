import { Skeleton } from "@/components/ui/skeleton";

export default function PublicLoading() {
    return (
        <main className="flex min-h-screen flex-col">
            {/* Hero — matches 2-col layout: left content, right browser mockup */}
            <section className="pt-16 pb-20 md:pt-24 md:pb-28 bg-gradient-to-b from-background to-muted/20">
                <div className="container mx-auto px-4 md:px-6 lg:px-8">
                    <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
                        <div className="flex flex-col">
                            <Skeleton className="mb-6 h-8 w-48 rounded-full" />
                            <Skeleton className="h-12 w-full max-w-md" />
                            <Skeleton className="mt-3 h-12 w-4/5 max-w-sm" />
                            <Skeleton className="mt-5 h-5 w-full max-w-lg" />
                            <Skeleton className="mt-2 h-5 w-4/5 max-w-md" />
                            <div className="mt-8 flex gap-4">
                                <Skeleton className="h-12 w-36 rounded-lg" />
                                <Skeleton className="h-12 w-32 rounded-lg" />
                            </div>
                            <Skeleton className="mt-8 h-12 w-full max-w-lg rounded-xl" />
                            <div className="mt-3 flex gap-2">
                                <Skeleton className="h-5 w-12" />
                                <Skeleton className="h-6 w-14 rounded-md" />
                                <Skeleton className="h-6 w-12 rounded-md" />
                                <Skeleton className="h-6 w-16 rounded-md" />
                                <Skeleton className="h-6 w-14 rounded-md" />
                            </div>
                            <div className="mt-10 flex gap-6">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-9 w-9 rounded-lg" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-5 w-14" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-9 w-9 rounded-lg" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-5 w-12" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-9 w-9 rounded-lg" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-5 w-14" />
                                        <Skeleton className="h-3 w-28" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="hidden lg:block">
                            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Edris — label, title, subtitle + 3 cards */}
            <section className="py-20 md:py-28 bg-background">
                <div className="container mx-auto px-4 md:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-16 space-y-3">
                        <Skeleton className="h-4 w-20 mx-auto rounded" />
                        <Skeleton className="h-10 w-80 max-w-full mx-auto" />
                        <Skeleton className="h-5 w-96 max-w-full mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-2xl border border-border p-8">
                                <Skeleton className="mb-6 h-14 w-14 rounded-xl" />
                                <Skeleton className="mb-2 h-6 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="mt-2 h-4 w-full" />
                                <Skeleton className="mt-2 h-4 w-5/6" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories — header + 8 horizontal cards */}
            <section className="py-20 md:py-28 bg-muted/30">
                <div className="container mx-auto px-4 md:px-6 lg:px-8">
                    <div className="mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-24 rounded" />
                            <Skeleton className="h-10 w-56" />
                            <Skeleton className="h-5 w-80 max-w-full" />
                        </div>
                        <Skeleton className="h-4 w-24 rounded" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
                                <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
                                <div className="min-w-0 flex-1 space-y-1">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Courses — header + 8 course cards matching PublicCourseCard */}
            <section className="py-20 md:py-28 bg-background">
                <div className="container mx-auto px-4 md:px-6 lg:px-8">
                    <div className="mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-20 rounded" />
                            <Skeleton className="h-10 w-48" />
                            <Skeleton className="h-5 w-96 max-w-full" />
                        </div>
                        <Skeleton className="h-10 w-40 rounded-md" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
                                <Skeleton className="aspect-video w-full rounded-lg mx-3 mt-3" />
                                <div className="p-3 flex flex-col gap-1">
                                    <Skeleton className="h-5 w-full" />
                                    <Skeleton className="h-5 w-4/5" />
                                    <Skeleton className="h-3 w-1/3 mt-1" />
                                    <div className="mt-1 flex items-center gap-1">
                                        <Skeleton className="h-3 w-8" />
                                        <Skeleton className="h-3 w-16" />
                                        <Skeleton className="h-3 w-12" />
                                    </div>
                                    <div className="mt-2 flex gap-2">
                                        <Skeleton className="h-6 w-12" />
                                        <Skeleton className="h-4 w-10" />
                                    </div>
                                    <div className="mt-1 flex gap-2">
                                        <Skeleton className="h-5 w-14 rounded-sm" />
                                        <Skeleton className="h-5 w-16 rounded-sm" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works — header + 3 step cards + CTA */}
            <section className="py-20 md:py-28 bg-muted/30">
                <div className="container mx-auto px-4 md:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-16 space-y-3">
                        <Skeleton className="h-4 w-24 mx-auto rounded" />
                        <Skeleton className="h-10 w-72 mx-auto" />
                        <Skeleton className="h-5 w-80 max-w-full mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 pt-10 text-center">
                                <Skeleton className="h-16 w-16 rounded-full mb-6" />
                                <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                                <Skeleton className="h-6 w-40 mb-2" />
                                <Skeleton className="h-4 w-full max-w-xs" />
                                <Skeleton className="mt-2 h-4 w-4/5 max-w-xs" />
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 flex justify-center">
                        <Skeleton className="h-12 w-48 rounded-lg" />
                    </div>
                </div>
            </section>

            {/* Testimonials — header + 3 quote cards */}
            <section className="py-20 md:py-28 bg-background">
                <div className="container mx-auto px-4 md:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-16 space-y-3">
                        <Skeleton className="h-4 w-24 mx-auto rounded" />
                        <Skeleton className="h-10 w-72 mx-auto" />
                        <Skeleton className="h-5 w-80 max-w-full mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-lg border border-border bg-card p-8">
                                <div className="flex gap-0.5 mb-5">
                                    <Skeleton className="h-4 w-4 rounded-sm" />
                                    <Skeleton className="h-4 w-4 rounded-sm" />
                                    <Skeleton className="h-4 w-4 rounded-sm" />
                                    <Skeleton className="h-4 w-4 rounded-sm" />
                                    <Skeleton className="h-4 w-4 rounded-sm" />
                                </div>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="mt-2 h-4 w-full" />
                                <Skeleton className="mt-2 h-4 w-5/6" />
                                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-border">
                                    <Skeleton className="h-11 w-11 rounded-full" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA — badge, headline, subtitle, buttons, social proof */}
            <section className="py-24 md:py-32 bg-primary/5">
                <div className="container mx-auto px-4 md:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center space-y-5">
                        <Skeleton className="h-8 w-40 mx-auto rounded-full" />
                        <Skeleton className="h-12 w-80 max-w-full mx-auto" />
                        <Skeleton className="h-5 w-96 max-w-full mx-auto" />
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
                            <Skeleton className="h-12 w-44 rounded-lg" />
                            <Skeleton className="h-12 w-44 rounded-lg" />
                        </div>
                        <div className="pt-8 flex items-center justify-center gap-2">
                            <div className="flex -space-x-1">
                                {[1, 2, 3, 4].map((j) => (
                                    <Skeleton key={j} className="h-6 w-6 rounded-full border-2 border-background" />
                                ))}
                            </div>
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
