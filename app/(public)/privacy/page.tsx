"use client";

import { Separator } from "@/components/ui/separator";

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: October 24, 2025</p>

            <Separator className="my-8" />

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introduction</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        At Edris LMS, we respect your privacy and are committed to protecting your personal data. This privacy policy explains how we look after your personal data when you visit our website and tells you about your privacy rights.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Data We Collect</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We may collect, use, store and transfer different kinds of personal data about you including:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
                        <li>Identity Data (name, username)</li>
                        <li>Contact Data (email address, phone number)</li>
                        <li>Technical Data (IP address, browser type)</li>
                        <li>Usage Data (how you use our website and courses)</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">3. How We Use Your Data</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
                        <li>To provide the educational services you have requested.</li>
                        <li>To manage your account and relationship with us.</li>
                        <li>To improve our website and services.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Data Security</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Your Rights</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, or transfer of your personal data.
                    </p>
                </section>
            </div>
        </div>
    );
}
