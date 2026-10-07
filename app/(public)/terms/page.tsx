"use client";

import { Separator } from "@/components/ui/separator";

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: October 24, 2025</p>

            <Separator className="my-8" />

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Acceptance of Terms</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        By accessing and using Edris LMS (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">2. User Accounts</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        To access certain features of the Platform, you may be required to create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Course Content and Intellectual Property</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        All content provided on the Platform, including but not limited to text, graphics, logos, and course materials, is the property of Edris LMS or its content providers and is protected by copyright laws.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">4. User Conduct</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        You agree not to use the Platform for any unlawful purpose or in any way that interrupts, damages, or impairs the service. Harassment, hate speech, and inappropriate behavior towards instructors or other students will not be tolerated.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Modifications to Service</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We reserve the right to modify or discontinue, temporarily or permanently, the Platform or any part thereof with or without notice.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Contact Us</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        If you have any questions about these Terms, please contact us at support@edrislms.com.
                    </p>
                </section>
            </div>
        </div>
    );
}
