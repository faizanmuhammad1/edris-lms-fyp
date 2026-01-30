"use client";

import { Separator } from "@/components/ui/separator";

export default function CookiesPage() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl font-bold mb-2">Cookie Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: October 24, 2025</p>

            <Separator className="my-8" />

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">1. What Are Cookies</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Cookies are small text files that are placed on your computer or mobile device when you browse websites. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">2. How We Use Cookies</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We use cookies to:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
                        <li>Keep you signed in.</li>
                        <li>Understand how you use our website.</li>
                        <li>Remember your preferences.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Types of Cookies We Use</h2>
                    <div className="space-y-4 mt-4">
                        <div>
                            <h3 className="font-medium text-foreground">Essential Cookies</h3>
                            <p className="text-muted-foreground">Necessary for the website to function properly.</p>
                        </div>
                        <div>
                            <h3 className="font-medium text-foreground">Analytics Cookies</h3>
                            <p className="text-muted-foreground">Help us understand how visitors interact with the website.</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Managing Cookies</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit www.aboutcookies.org or www.allaboutcookies.org.
                    </p>
                </section>
            </div>
        </div>
    );
}
