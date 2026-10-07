import type { Metadata } from "next";
import { LegalPage } from "../_components/LegalPage";
import { pageMetadata } from "../_lib/seo";

export const metadata: Metadata = pageMetadata({
    title: "Cookie Policy",
    description: "What cookies Edris LMS uses, why we use them, and how you can manage them in your browser.",
    path: "/cookies",
});

export default function CookiesPage() {
    return (
        <LegalPage title="Cookie Policy" subtitle="Last updated: October 24, 2025">
            <section>
                <h2>1. What Are Cookies</h2>
                <p>
                    Cookies are small text files that are placed on your computer or mobile device when you browse websites. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
                </p>
            </section>

            <section>
                <h2>2. How We Use Cookies</h2>
                <p>We use cookies to:</p>
                <ul>
                    <li>Keep you signed in.</li>
                    <li>Understand how you use our website.</li>
                    <li>Remember your preferences.</li>
                </ul>
            </section>

            <section>
                <h2>3. Types of Cookies We Use</h2>
                <div className="mt-4 space-y-4">
                    <div>
                        <h3>Essential Cookies</h3>
                        <p>Necessary for the website to function properly.</p>
                    </div>
                    <div>
                        <h3>Analytics Cookies</h3>
                        <p>Help us understand how visitors interact with the website.</p>
                    </div>
                </div>
            </section>

            <section>
                <h2>4. Managing Cookies</h2>
                <p>
                    Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit{" "}
                    <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer">
                        www.aboutcookies.org
                    </a>{" "}
                    or{" "}
                    <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer">
                        www.allaboutcookies.org
                    </a>
                    .
                </p>
            </section>
        </LegalPage>
    );
}
