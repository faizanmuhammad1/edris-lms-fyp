import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { containerClass, sectionClass } from "./SectionHeading";

export function CTASection({ totalStudents }: { totalStudents: number }) {
    return (
        <section aria-labelledby="cta-heading" className={`bg-background ${sectionClass}`}>
            <div className={containerClass}>
                <div className="relative isolate mx-auto max-w-5xl overflow-hidden rounded-3xl bg-zinc-950 px-6 py-14 ring-1 ring-white/10 text-center sm:px-12 sm:py-20">
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(93,134,108,0.35),transparent)]"
                    />
                    <h2
                        id="cta-heading"
                        className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl"
                    >
                        Ready to start learning?
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
                        {totalStudents > 0
                            ? `Join ${totalStudents.toLocaleString()} learner${totalStudents === 1 ? "" : "s"} building real skills with expert-led courses, AI-powered support and verified certificates.`
                            : "Build real skills with expert-led courses, AI-powered support and verified certificates."}
                    </p>
                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link href="/courses" className={buttonVariants({ size: "lg", className: "h-12 px-6 text-base" })}>
                            Browse courses
                            <ArrowRight aria-hidden="true" />
                        </Link>
                        <Link
                            href="/login"
                            className={buttonVariants({
                                size: "lg",
                                variant: "outline",
                                className:
                                    "h-12 border-white/20 bg-white/5 px-6 text-base text-white hover:bg-white/10 hover:text-white dark:border-white/20 dark:bg-white/5 dark:hover:bg-white/10",
                            })}
                        >
                            Create a free account
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
