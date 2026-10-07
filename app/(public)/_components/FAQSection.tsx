import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { SectionHeading, containerClass, sectionClass } from "./SectionHeading";

export const faqs = [
    {
        question: "How do the blockchain certificates work?",
        answer:
            "When you complete a course, a unique certificate is generated and anchored on the blockchain. Anyone — an employer, for example — can verify it with the certificate ID, without having to take our word for it.",
    },
    {
        question: "Do I get lifetime access to courses I purchase?",
        answer:
            "Yes. Once you enroll in a course you keep access to its video lessons, quizzes and any future updates the instructor makes to that course.",
    },
    {
        question: "How does the AI assistant help me learn?",
        answer:
            "The AI tutor is context-aware: ask a question while watching a lesson and it answers based on what that lesson covers, so you get specific help instantly instead of generic answers.",
    },
    {
        question: "How are payments handled?",
        answer:
            "Payments are processed securely by Stripe — we never see or store your card details. If something goes wrong with a purchase, contact our support team and we'll help sort it out.",
    },
    {
        question: "Can I learn on my phone or tablet?",
        answer:
            "Yes. Edris works in any modern browser on mobile, tablet and desktop. Lessons are streamed, so you'll need an internet connection while you learn.",
    },
];

export function FAQSection() {
    return (
        <section id="faq" aria-labelledby="faq-heading" className={`scroll-mt-20 bg-background ${sectionClass}`}>
            <div className={`${containerClass} grid gap-10 lg:grid-cols-12 lg:gap-12`}>
                <SectionHeading
                    id="faq-heading"
                    eyebrow="FAQ"
                    title="Got questions? We've got answers."
                    description={
                        <>
                            Everything you need to know about learning on Edris. Can&apos;t find what you&apos;re looking
                            for?{" "}
                            <Link href="/contact" className="font-medium text-primary underline-offset-4 hover:underline">
                                Contact our team
                            </Link>
                            .
                        </>
                    }
                    className="lg:sticky lg:top-24 lg:col-span-5 lg:self-start"
                />

                <div className="divide-y rounded-2xl border bg-card lg:col-span-7">
                    {faqs.map((faq, index) => (
                        <details key={faq.question} className="group" open={index === 0}>
                            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50 sm:px-6 [&::-webkit-details-marker]:hidden">
                                <h3 className="text-base sm:text-lg">{faq.question}</h3>
                                <ChevronDown
                                    className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                                    aria-hidden="true"
                                />
                            </summary>
                            <p className="px-5 pb-5 text-base leading-relaxed text-muted-foreground sm:px-6">{faq.answer}</p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}
