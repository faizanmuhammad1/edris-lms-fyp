import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { NewsletterSubscribe } from "../_components/NewsletterSubscribe";
import { pageMetadata } from "../_lib/seo";

export const metadata: Metadata = pageMetadata({
    title: "Blog",
    description: "News, learning tips and product updates from the Edris LMS team — coming soon.",
    path: "/blog",
    // No articles are published yet; keep the placeholder out of search results.
    noindex: true,
});

/**
 * The blog has no published articles yet. Rather than showing placeholder posts that lead
 * nowhere, this page says so honestly and offers the newsletter for updates.
 */
export default function BlogPage() {
    return (
        <div className="bg-background">
            <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6 sm:py-24">
                <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
                    <Newspaper className="size-7 text-primary" aria-hidden="true" />
                </span>
                <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">The Edris blog</h1>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                    We&apos;re preparing articles on AI in education, verifiable credentials and getting the most out of
                    online learning. Subscribe and we&apos;ll let you know when the first posts are live.
                </p>

                <div className="mx-auto mt-10 max-w-md text-left">
                    <h2 className="mb-3 text-sm font-semibold text-foreground">Get new articles by email</h2>
                    <NewsletterSubscribe />
                </div>

                <div className="mt-10 border-t pt-10">
                    <h2 className="text-lg font-semibold">In the meantime</h2>
                    <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link href="/courses" className={buttonVariants({ size: "lg", className: "h-11" })}>
                            Browse courses
                            <ArrowRight aria-hidden="true" />
                        </Link>
                        <Link href="/#faq" className={buttonVariants({ variant: "outline", size: "lg", className: "h-11" })}>
                            Read the FAQ
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
