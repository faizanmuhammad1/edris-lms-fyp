"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    Clock,
    GraduationCap,
    Loader2,
    Sparkles,
    TrendingUp,
    Users,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { applyAsTeacher } from "@/app/actions/apply-teacher";
import { getTeacherStatus } from "@/app/data/user/get-teacher-status";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type TeachStats = { students: number; teachers: number; courses: number };

const benefits = [
    {
        icon: Users,
        title: "Reach learners",
        description: "Connect with students on Edris and grow your audience.",
    },
    {
        icon: TrendingUp,
        title: "Earn revenue",
        description: "Get paid for your expertise and build a sustainable income stream.",
    },
    {
        icon: BookOpen,
        title: "Easy tools",
        description: "Use the course builder, quizzes and AI transcription to create engaging content.",
    },
    {
        icon: GraduationCap,
        title: "Support",
        description: "Our team reviews applications and helps you get your first course live.",
    },
];

const container = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

function StatusCard({
    icon,
    tone,
    title,
    description,
    children,
}: {
    icon: React.ReactNode;
    tone: "success" | "pending" | "error" | "default";
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    const toneClass = {
        success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        default: "bg-primary/10 text-primary",
    }[tone];

    return (
        <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
            <Card className="w-full max-w-md shadow-md">
                <CardHeader className="text-center">
                    <div className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-full ${toneClass}`}>
                        {icon}
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                    <CardDescription className="text-base">{description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">{children}</CardContent>
            </Card>
        </div>
    );
}

export function TeachContent({ stats }: { stats: TeachStats }) {
    const { data: session, isPending } = authClient.useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [teacherStatus, setTeacherStatus] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);

    useEffect(() => {
        async function fetchStatus() {
            if (session) {
                try {
                    const status = await getTeacherStatus();
                    setTeacherStatus(status?.teacherStatus || null);
                    setRejectionReason(status?.teacherRejectionReason || null);
                } catch (error) {
                    console.error("Failed to fetch teacher status:", error);
                } finally {
                    setIsLoadingStatus(false);
                }
            } else {
                setIsLoadingStatus(false);
            }
        }
        fetchStatus();
    }, [session]);

    const handleApply = async () => {
        setIsSubmitting(true);
        try {
            const result = await applyAsTeacher();
            if (result.success) {
                toast.success(result.message);
                // Refresh status
                const status = await getTeacherStatus();
                setTeacherStatus(status?.teacherStatus || null);
                setRejectionReason(status?.teacherRejectionReason || null);
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isPending || isLoadingStatus) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center px-4" role="status" aria-label="Loading">
                <div className="w-full max-w-md space-y-4">
                    <Skeleton className="mx-auto size-14 rounded-full" />
                    <Skeleton className="mx-auto h-8 w-2/3" />
                    <Skeleton className="mx-auto h-4 w-full" />
                    <Skeleton className="h-11 w-full" />
                </div>
            </div>
        );
    }

    // Approved teacher
    if (teacherStatus === "Approved") {
        return (
            <StatusCard
                tone="success"
                icon={<CheckCircle2 className="size-7" aria-hidden="true" />}
                title="You're a teacher!"
                description="You have been approved to teach on Edris LMS."
            >
                <Link href="/teacher" className={buttonVariants({ size: "lg", className: "h-11 w-full" })}>
                    Go to teacher dashboard
                    <ArrowRight aria-hidden="true" />
                </Link>
            </StatusCard>
        );
    }

    // Pending approval
    if (teacherStatus === "Pending") {
        return (
            <StatusCard
                tone="pending"
                icon={<Clock className="size-7" aria-hidden="true" />}
                title="Application pending"
                description="Your teacher application is under review by our admin team."
            >
                <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                    We&apos;ll notify you once a decision has been made. This usually takes 1–2 business days.
                </p>
                <Link href="/" className={buttonVariants({ variant: "outline", className: "h-11 w-full" })}>
                    Back to home
                </Link>
            </StatusCard>
        );
    }

    // Rejected
    if (teacherStatus === "Rejected") {
        return (
            <StatusCard
                tone="error"
                icon={<XCircle className="size-7" aria-hidden="true" />}
                title="Application not approved"
                description="Unfortunately, your teacher application was not approved."
            >
                {rejectionReason && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                        <p className="mb-1 text-sm font-medium">Reason</p>
                        <p className="break-words text-sm text-muted-foreground">{rejectionReason}</p>
                    </div>
                )}
                <p className="text-sm text-muted-foreground">
                    You can reapply after addressing the concerns mentioned above.
                </p>
                <Button onClick={handleApply} disabled={isSubmitting} className="h-11 w-full">
                    {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
                    {isSubmitting ? "Submitting…" : "Reapply"}
                </Button>
            </StatusCard>
        );
    }

    // Logged in, no application yet
    if (session) {
        return (
            <StatusCard
                tone="default"
                icon={<GraduationCap className="size-7" aria-hidden="true" />}
                title="Apply to become a teacher"
                description="Join our community of educators and start sharing your knowledge."
            >
                <div className="space-y-4 rounded-lg bg-muted/50 p-5">
                    <h2 className="font-semibold">What happens next?</h2>
                    <ol className="space-y-3 text-sm text-muted-foreground">
                        {[
                            "Submit your application with the button below.",
                            "Our admin team reviews it (usually within 1–2 business days).",
                            "Once approved, you get the teacher dashboard and course creation tools.",
                        ].map((step, i) => (
                            <li key={step} className="flex items-start gap-3">
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                                    {i + 1}
                                </span>
                                <span>{step}</span>
                            </li>
                        ))}
                    </ol>
                </div>
                <Button onClick={handleApply} disabled={isSubmitting} size="lg" className="h-11 w-full">
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin" aria-hidden="true" />
                            Submitting application…
                        </>
                    ) : (
                        <>
                            Submit application
                            <ArrowRight aria-hidden="true" />
                        </>
                    )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                    By applying, you agree to our <Link href="/terms" className="underline underline-offset-4">terms of service</Link>.
                </p>
            </StatusCard>
        );
    }

    // Signed out: landing page
    const statItems = [
        { value: stats.students, label: "Active students" },
        { value: stats.teachers, label: "Teachers" },
        { value: stats.courses, label: "Published courses" },
    ];
    const hasStats = statItems.some((s) => s.value > 0);

    return (
        <div className="bg-background">
            <section aria-labelledby="teach-heading" className="border-b bg-gradient-to-b from-primary/[0.06] to-transparent">
                <div className={`${container} py-16 text-center sm:py-20 lg:py-24`}>
                    <Badge variant="outline" className="mb-6 gap-1.5 border-primary/25 bg-primary/5 px-3 py-1 text-primary">
                        <Sparkles aria-hidden="true" />
                        Join our teaching community
                    </Badge>
                    <h1 id="teach-heading" className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                        Teach on Edris LMS
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
                        Share your knowledge with learners, create courses with our course builder, earn revenue and
                        make an impact.
                    </p>
                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                            href="/login?callbackURL=/teach"
                            className={buttonVariants({ size: "lg", className: "h-12 px-6 text-base" })}
                        >
                            Sign in to apply
                            <ArrowRight aria-hidden="true" />
                        </Link>
                        <Link
                            href="/login?callbackURL=/teach"
                            className={buttonVariants({ size: "lg", variant: "outline", className: "h-12 px-6 text-base" })}
                        >
                            Create an account
                        </Link>
                    </div>
                </div>
            </section>

            <section aria-labelledby="benefits-heading" className="py-16 sm:py-20 lg:py-24">
                <div className={container}>
                    <h2 id="benefits-heading" className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
                        Why teach with us?
                    </h2>
                    <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                        {benefits.map((benefit) => (
                            <li key={benefit.title} className="rounded-2xl border bg-card p-6">
                                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <benefit.icon className="size-6" aria-hidden="true" />
                                </span>
                                <h3 className="mt-5 text-lg font-semibold">{benefit.title}</h3>
                                <p className="mt-2 text-base text-muted-foreground">{benefit.description}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {hasStats && (
                <section aria-labelledby="teach-stats-heading" className="border-t bg-muted/30 py-16 sm:py-20">
                    <div className={container}>
                        <h2 id="teach-stats-heading" className="sr-only">
                            Edris in numbers
                        </h2>
                        <dl className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
                            {statItems.map((stat) => (
                                <div key={stat.label} className="flex flex-col-reverse">
                                    <dt className="mt-2 text-muted-foreground">{stat.label}</dt>
                                    <dd className="text-4xl font-semibold tracking-tight text-primary">
                                        {stat.value.toLocaleString()}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </section>
            )}
        </div>
    );
}
