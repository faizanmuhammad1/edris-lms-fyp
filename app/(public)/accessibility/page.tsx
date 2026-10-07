import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "../_components/LegalPage";
import { pageMetadata } from "../_lib/seo";

export const metadata: Metadata = pageMetadata({
    title: "Accessibility Statement",
    description: "Edris LMS's commitment to digital accessibility, our WCAG 2.1 AA conformance status, and how to report barriers.",
    path: "/accessibility",
});

export default function AccessibilityPage() {
    return (
        <LegalPage title="Accessibility Statement" subtitle="Our commitment to inclusivity">
            <section>
                <h2>Our Commitment</h2>
                <p>
                    Edris LMS is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
                </p>
            </section>

            <section>
                <h2>Conformance Status</h2>
                <p>
                    The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. Edris LMS is partially conformant with WCAG 2.1 level AA. Partially conformant means that some parts of the content do not fully conform to the accessibility standard.
                </p>
            </section>

            <section>
                <h2>Feedback</h2>
                <p>
                    We welcome your feedback on the accessibility of Edris LMS. Please let us know if you encounter accessibility barriers on Edris LMS:
                </p>
                <ul>
                    <li>
                        Email: <a href="mailto:support@edrislms.com">support@edrislms.com</a>
                    </li>
                    <li>
                        Or use our <Link href="/contact">contact page</Link>
                    </li>
                </ul>
                <p className="mt-4">We try to respond to feedback within 2 business days.</p>
            </section>
        </LegalPage>
    );
}
