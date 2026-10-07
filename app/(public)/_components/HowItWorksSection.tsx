import Link from "next/link";
import { ArrowRight, BadgeCheck, PlayCircle, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SectionHeading, containerClass, sectionClass } from "./SectionHeading";

const steps = [
    {
        number: "01",
        icon: Search,
        title: "Browse & enroll",
        description:
            "Explore the catalog, filter by category or skill level, and enroll in courses that match your goals.",
    },
    {
        number: "02",
        icon: PlayCircle,
        title: "Learn at your pace",
        description:
            "Watch video lessons, take quizzes and ask the AI assistant whenever you get stuck — on your schedule.",
    },
    {
        number: "03",
        icon: BadgeCheck,
        title: "Get certified",
        description:
            "Complete your course and receive a blockchain-verified certificate that employers can check instantly.",
    },
];

export function HowItWorksSection() {
    return (
        <section
            id="how-it-works"
            aria-labelledby="how-heading"
            className={`scroll-mt-20 bg-background ${sectionClass}`}
        >
            <div className={containerClass}>
                <SectionHeading
                    id="how-heading"
                    eyebrow="How it works"
                    title="Three steps to a new skill"
                    description="From browsing to certified — here is how your learning journey unfolds."
                    align="center"
                />

                <ol className="mt-12 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
                    {steps.map((step) => (
                        <li key={step.number} className="relative flex flex-col rounded-2xl border bg-card p-6 sm:p-8">
                            <div className="flex items-center justify-between">
                                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <step.icon className="size-6" aria-hidden="true" />
                                </span>
                                <span className="font-mono text-sm font-medium text-muted-foreground" aria-hidden="true">
                                    {step.number}
                                </span>
                            </div>
                            <h3 className="mt-6 text-xl font-semibold text-foreground">
                                <span className="sr-only">Step {Number(step.number)}: </span>
                                {step.title}
                            </h3>
                            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{step.description}</p>
                        </li>
                    ))}
                </ol>

                <div className="mt-12 flex justify-center">
                    <Link href="/courses" className={buttonVariants({ size: "lg", className: "h-12 px-6 text-base" })}>
                        Start learning now
                        <ArrowRight aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
