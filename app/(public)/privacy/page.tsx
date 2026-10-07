import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "../_components/LegalPage";
import { pageMetadata } from "../_lib/seo";

export const metadata: Metadata = pageMetadata({
    title: "Privacy Policy",
    description: "How Edris LMS collects, uses and protects your personal data, and the rights you have over it.",
    path: "/privacy",
});

export default function PrivacyPage() {
    return (
        <LegalPage title="Privacy Policy" subtitle="Last updated: October 24, 2025">
            <section>
                <h2>1. Introduction</h2>
                <p>
                    At Edris LMS, we respect your privacy and are committed to protecting your personal data. This privacy policy explains how we look after your personal data when you visit our website and tells you about your privacy rights.
                </p>
            </section>

            <section>
                <h2>2. Data We Collect</h2>
                <p>We may collect, use, store and transfer different kinds of personal data about you including:</p>
                <ul>
                    <li>Identity Data (name, username)</li>
                    <li>Contact Data (email address, phone number)</li>
                    <li>Technical Data (IP address, browser type)</li>
                    <li>Usage Data (how you use our website and courses)</li>
                </ul>
            </section>

            <section>
                <h2>3. How We Use Your Data</h2>
                <p>
                    We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                </p>
                <ul>
                    <li>To provide the educational services you have requested.</li>
                    <li>To manage your account and relationship with us.</li>
                    <li>To improve our website and services.</li>
                </ul>
            </section>

            <section>
                <h2>4. Data Security</h2>
                <p>
                    We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way.
                </p>
            </section>

            <section>
                <h2>5. Your Rights</h2>
                <p>
                    Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, or transfer of your personal data. To make a request, please <Link href="/contact">contact us</Link>.
                </p>
            </section>
        </LegalPage>
    );
}
