import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "../_components/LegalPage";
import { pageMetadata } from "../_lib/seo";

export const metadata: Metadata = pageMetadata({
    title: "Terms of Service",
    description: "The terms that govern your use of Edris LMS, including accounts, course content, conduct and changes to the service.",
    path: "/terms",
});

export default function TermsPage() {
    return (
        <LegalPage title="Terms of Service" subtitle="Last updated: October 24, 2025">
            <section>
                <h2>1. Acceptance of Terms</h2>
                <p>
                    By accessing and using Edris LMS (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                </p>
            </section>

            <section>
                <h2>2. User Accounts</h2>
                <p>
                    To access certain features of the Platform, you may be required to create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
                </p>
            </section>

            <section>
                <h2>3. Course Content and Intellectual Property</h2>
                <p>
                    All content provided on the Platform, including but not limited to text, graphics, logos, and course materials, is the property of Edris LMS or its content providers and is protected by copyright laws.
                </p>
            </section>

            <section>
                <h2>4. User Conduct</h2>
                <p>
                    You agree not to use the Platform for any unlawful purpose or in any way that interrupts, damages, or impairs the service. Harassment, hate speech, and inappropriate behavior towards instructors or other students will not be tolerated.
                </p>
            </section>

            <section>
                <h2>5. Modifications to Service</h2>
                <p>
                    We reserve the right to modify or discontinue, temporarily or permanently, the Platform or any part thereof with or without notice.
                </p>
            </section>

            <section>
                <h2>6. Contact Us</h2>
                <p>
                    If you have any questions about these Terms, please <Link href="/contact">contact us</Link> or email{" "}
                    <a href="mailto:support@edrislms.com">support@edrislms.com</a>.
                </p>
            </section>
        </LegalPage>
    );
}
