import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bot, PlaySquare, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SectionHeading, containerClass, sectionClass } from "./SectionHeading";

export function WhyEdrisSection() {
    return (
        <section aria-labelledby="why-heading" className={`border-y bg-muted/30 ${sectionClass}`}>
            <div className={containerClass}>
                <SectionHeading
                    id="why-heading"
                    eyebrow="Why Edris"
                    title="Everything you need to learn — and prove it"
                    description="Modern course delivery, expert instruction and credentials anyone can verify, in one place."
                    align="center"
                />

                <div className="mt-12 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-12">
                    {/* AI tutor */}
                    <article className="relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-8 md:col-span-7 lg:col-span-8">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Bot className="size-6" aria-hidden="true" />
                        </div>
                        <h3 className="mt-6 text-xl font-semibold text-foreground sm:text-2xl">AI-powered tutor</h3>
                        <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
                            Stuck on a concept? Ask the context-aware AI assistant right inside your video lessons and get
                            a clear explanation in seconds.
                        </p>
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 opacity-[0.06] sm:block"
                            style={{
                                backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
                                backgroundSize: "20px 20px",
                            }}
                        />
                    </article>

                    {/* Verified certificates */}
                    <article className="rounded-2xl border bg-card p-6 sm:p-8 md:col-span-5 lg:col-span-4">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <ShieldCheck className="size-6" aria-hidden="true" />
                        </div>
                        <h3 className="mt-6 text-xl font-semibold text-foreground sm:text-2xl">Prove it</h3>
                        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                            Edris certificates are anchored on the blockchain, giving you tamper-proof evidence of your
                            skills that anyone can verify.
                        </p>
                    </article>

                    {/* Expert-led video */}
                    <article className="relative isolate overflow-hidden rounded-2xl border bg-zinc-950 p-6 text-white sm:p-8 md:col-span-6">
                        <Image
                            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop"
                            alt=""
                            fill
                            sizes="(min-width: 1280px) 600px, (min-width: 768px) 50vw, 100vw"
                            className="-z-10 object-cover opacity-30 grayscale"
                        />
                        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/30" />
                        <div className="flex min-h-48 flex-col justify-end">
                            <PlaySquare className="size-7 text-white/90" aria-hidden="true" />
                            <h3 className="mt-4 text-xl font-semibold sm:text-2xl">Expert-led videos</h3>
                            <p className="mt-3 max-w-md text-base leading-relaxed text-zinc-300">
                                Engaging, visual-first lessons taught by practitioners — watch at your own pace on any device.
                            </p>
                        </div>
                    </article>

                    {/* CTA */}
                    <article className="flex flex-col items-start justify-center rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8 md:col-span-6">
                        <h3 className="text-xl font-semibold sm:text-2xl">Ready to grow your career?</h3>
                        <p className="mt-3 max-w-md text-base leading-relaxed text-primary-foreground">
                            Browse the catalog and start learning today.
                        </p>
                        <Link
                            href="/courses"
                            className={buttonVariants({
                                variant: "secondary",
                                size: "lg",
                                className: "mt-6 h-11 border-0 bg-primary-foreground text-primary shadow-sm hover:bg-primary-foreground/90 hover:text-primary",
                            })}
                        >
                            Explore the curriculum
                            <ArrowRight aria-hidden="true" />
                        </Link>
                    </article>
                </div>
            </div>
        </section>
    );
}
