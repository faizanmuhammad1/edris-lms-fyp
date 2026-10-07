import { Bell, BookOpen, CheckCircle, LayoutDashboard, Search, Settings, Shield, Video } from "lucide-react";
import { SectionHeading, containerClass, sectionClass } from "./SectionHeading";

const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: BookOpen, label: "My Courses" },
    { icon: Video, label: "Live Sessions" },
    { icon: CheckCircle, label: "Certificates" },
];

const inProgress = [
    { title: "Advanced React Hooks", progress: 75 },
    { title: "UI/UX Design Masterclass", progress: 30 },
    { title: "Web3 Smart Contracts", progress: 12 },
];

/** Static illustration of the learner dashboard. Purely decorative, so it is hidden from assistive tech. */
export function PlatformMockupSection() {
    return (
        <section aria-labelledby="platform-heading" className={`bg-background ${sectionClass}`}>
            <div className={containerClass}>
                <SectionHeading
                    id="platform-heading"
                    eyebrow="Platform experience"
                    title="A workspace designed for focus"
                    description="Your courses, progress and certificates in one clean dashboard — on any screen size."
                    align="center"
                />

                <figure className="mx-auto mt-12 max-w-5xl">
                    <div
                        aria-hidden="true"
                        className="select-none overflow-hidden rounded-xl border bg-card shadow-xl shadow-primary/5 sm:rounded-2xl"
                    >
                        {/* Browser chrome */}
                        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
                            <span className="size-2.5 rounded-full bg-red-400/80" />
                            <span className="size-2.5 rounded-full bg-yellow-400/80" />
                            <span className="size-2.5 rounded-full bg-green-400/80" />
                            <div className="mx-auto hidden w-full max-w-xs truncate rounded-md border bg-background px-3 py-1 text-center text-xs text-muted-foreground sm:block">
                                edrislms.com/dashboard
                            </div>
                        </div>

                        <div className="flex aspect-[4/3] w-full overflow-hidden bg-muted/20 sm:aspect-[16/10]">
                            {/* Sidebar */}
                            <div className="hidden w-52 shrink-0 flex-col border-r bg-card p-4 md:flex">
                                <div className="mb-6 flex items-center gap-2 px-2 py-2">
                                    <Shield className="size-5 text-primary" />
                                    <span className="font-semibold text-foreground">Edris LMS</span>
                                </div>
                                <div className="flex-1 space-y-1">
                                    {sidebarItems.map((item) => (
                                        <div
                                            key={item.label}
                                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${item.active ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                                        >
                                            <item.icon className="size-4" />
                                            {item.label}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3 border-t px-3 pt-4 text-sm font-medium text-muted-foreground">
                                    <Settings className="size-4" />
                                    Settings
                                </div>
                            </div>

                            {/* Main */}
                            <div className="flex min-w-0 flex-1 flex-col">
                                <div className="flex h-12 shrink-0 items-center justify-between border-b bg-card/60 px-4 sm:h-14 sm:px-6">
                                    <div className="hidden h-8 w-56 items-center gap-2 rounded-md border bg-muted/50 px-3 text-xs text-muted-foreground sm:flex">
                                        <Search className="size-3.5" />
                                        Search courses…
                                    </div>
                                    <div className="ml-auto flex items-center gap-3">
                                        <Bell className="size-4 text-muted-foreground" />
                                        <div className="size-7 rounded-full bg-primary/30" />
                                    </div>
                                </div>

                                <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 sm:gap-6 sm:p-6">
                                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-6">
                                        <p className="text-base font-semibold text-foreground sm:text-xl">Welcome back, Alex</p>
                                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                                            You&apos;ve learned for 4 hours this week. Keep it up!
                                        </p>
                                        <div className="mt-3 inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground sm:mt-4">
                                            Resume learning
                                        </div>
                                    </div>

                                    <div>
                                        <p className="mb-3 text-sm font-semibold text-foreground">In progress</p>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {inProgress.map((course, idx) => (
                                                <div
                                                    key={course.title}
                                                    className={`rounded-lg border bg-card p-3 ${idx > 0 ? "hidden sm:block" : ""} ${idx > 1 ? "sm:hidden lg:block" : ""}`}
                                                >
                                                    <div className="mb-3 h-14 rounded-md bg-muted sm:h-16" />
                                                    <p className="truncate text-sm font-medium text-foreground">{course.title}</p>
                                                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                                                        <span>{course.progress}% complete</span>
                                                        <span className="font-medium text-foreground">Continue</span>
                                                    </div>
                                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                                                        <div className="h-full rounded-full bg-primary" style={{ width: `${course.progress}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <figcaption className="sr-only">
                        Illustration of the Edris learner dashboard showing courses in progress.
                    </figcaption>
                </figure>
            </div>
        </section>
    );
}
