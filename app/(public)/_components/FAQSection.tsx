"use client";

import { useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown } from "lucide-react";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const faqs = [
    {
        question: "How do the blockchain certificates work?",
        answer: "Every time you complete a course, a unique, cryptographically secure certificate is generated and anchored to the blockchain. This means your achievement is permanently verifiable by employers worldwide without relying on our servers."
    },
    {
        question: "Do I get lifetime access to courses I purchase?",
        answer: "Yes! Once you enroll in a course, you have unlimited lifetime access to the video materials, quizzes, and any future updates the instructor makes to that specific course."
    },
    {
        question: "How does the AI assistant help me learn?",
        answer: "Our AI tutor is context-aware. If you get stuck at the 3:45 mark of a video, you can ask a question and the AI will answer based on exactly what the instructor was teaching at that moment, providing tailored, instant support."
    },
    {
        question: "What is your refund policy?",
        answer: "We offer a 30-day money-back guarantee on all standalone course purchases. If you aren't satisfied with the learning experience, simply request a refund through your dashboard."
    },
    {
        question: "Can I download courses for offline viewing?",
        answer: "Currently, offline viewing is supported through our iOS and Android mobile applications. On the web version, an active internet connection is required to stream the high-definition videos."
    }
];

export function FAQSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    useGSAP(() => {
        gsap.fromTo(".gsap-faq-header",
            { y: 30, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ".gsap-faq-header",
                    start: "top 85%",
                }
            }
        );

        gsap.fromTo(".gsap-faq-item",
            { y: 20, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.5,
                stagger: 0.1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: ".gsap-faq-list",
                    start: "top 80%",
                }
            }
        );
    }, { scope: sectionRef });

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section ref={sectionRef} className="py-24 md:py-32 bg-muted/20 relative overflow-hidden">
            {/* Ambient effects */}
            <div className="absolute -top-[200px] -left-[200px] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="container relative z-10 mx-auto px-6 md:px-12 lg:px-24 xl:px-32 2xl:px-40 max-w-[1400px]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">

                    {/* Left Column: Heading */}
                    <div className="gsap-faq-header lg:col-span-5 lg:sticky lg:top-32">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                            Common Questions
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
                            Got questions?<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                                We&apos;ve got answers.
                            </span>
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                            Everything you need to know about the product and how it works. Can&apos;t find the answer you&apos;re looking for? Please chat to our friendly team.
                        </p>
                    </div>

                    {/* Right Column: Accordion */}
                    <div className="gsap-faq-list lg:col-span-7 flex flex-col gap-4">
                        {faqs.map((faq, index) => {
                            const isOpen = openIndex === index;

                            return (
                                <div
                                    key={index}
                                    className={`gsap-faq-item bg-card border border-border/60 hover:border-primary/30 rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'shadow-xl shadow-primary/[0.04] ring-1 ring-primary/20' : 'hover:shadow-md'}`}
                                >
                                    <button
                                        onClick={() => toggleFaq(index)}
                                        className="flex w-full items-center justify-between p-6 md:p-8 text-left focus:outline-none"
                                    >
                                        <span className="text-lg md:text-xl font-semibold text-foreground pr-8 group-hover:text-primary transition-colors">
                                            {faq.question}
                                        </span>
                                        <div className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-full border border-border/50 transition-all duration-300 ${isOpen ? 'bg-primary/10 border-primary/20 text-primary rotate-180' : 'bg-muted/50 text-muted-foreground'}`}>
                                            <ChevronDown className="w-5 h-5" />
                                        </div>
                                    </button>

                                    <div
                                        className="overflow-hidden transition-all duration-500 ease-in-out"
                                        style={{ maxHeight: isOpen ? '500px' : '0px', opacity: isOpen ? 1 : 0 }}
                                    >
                                        <div className="px-6 md:px-8 pb-8 text-muted-foreground leading-relaxed text-base md:text-lg">
                                            {faq.answer}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </section>
    );
}
