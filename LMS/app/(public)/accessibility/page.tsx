"use client";

import { Separator } from "@/components/ui/separator";

export default function AccessibilityPage() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl font-bold mb-2">Accessibility Statement</h1>
            <p className="text-muted-foreground mb-8">Commitment to Inclusivity</p>

            <Separator className="my-8" />

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Our Commitment</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Edris LMS is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Conformance Status</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. Edris LMS is partially conformant with WCAG 2.1 level AA. Partially conformant means that some parts of the content do not fully conform to the accessibility standard.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">Feedback</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We welcome your feedback on the accessibility of Edris LMS. Please let us know if you encounter accessibility barriers on Edris LMS:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
                        <li>E-mail: support@edrislms.com</li>
                        <li>Phone: +1 (555) 123-4567</li>
                    </ul>
                    <p className="text-muted-foreground mt-4">We try to respond to feedback within 2 business days.</p>
                </section>
            </div>
        </div>
    );
}
