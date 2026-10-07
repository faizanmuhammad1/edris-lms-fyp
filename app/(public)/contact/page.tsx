import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, HelpCircle, Mail, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getEmailBranding } from "@/lib/email-templates";
import {
    verificationPortalLinkProps,
    verificationPortalUrl,
} from "@/lib/verification-portal-url";
import { containerClass } from "../_components/SectionHeading";
import { pageMetadata } from "../_lib/seo";
import { ContactForm } from "./_components/ContactForm";

export const metadata: Metadata = pageMetadata({
    title: "Contact us",
    description: "Questions about a course, your account or a certificate? Get in touch with the Edris LMS support team.",
    path: "/contact",
});

/** Used when no support address is configured in Admin → Settings. */
const FALLBACK_SUPPORT_EMAIL = "support@edrislms.com";

export default async function ContactPage() {
    const branding = await getEmailBranding();
    const supportEmail = branding.supportEmail ?? FALLBACK_SUPPORT_EMAIL;
    const verificationHref = verificationPortalUrl();

    const helpLinks = [
        { icon: BookOpen, label: "Browse the course catalog", href: "/courses" },
        { icon: HelpCircle, label: "Read the FAQ", href: "/#faq" },
        { icon: ShieldCheck, label: "Verify a certificate", href: verificationHref },
    ];

    return (
        <div className="bg-background">
            {/* Header */}
            <div className="relative isolate overflow-hidden">
                <Image
                    src="/contact-hero.png"
                    alt=""
                    fill
                    priority
                    sizes="100vw"
                    className="-z-10 object-cover"
                />
                <div aria-hidden="true" className="absolute inset-0 -z-10 bg-zinc-950/70" />
                <div className={`${containerClass} py-16 text-center sm:py-24`}>
                    <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Get in touch</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-200 sm:text-lg">
                        Questions about a course, your account or a certificate? We&apos;d love to hear from you.
                    </p>
                </div>
            </div>

            <div className={`${containerClass} py-12 sm:py-16`}>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Contact details */}
                    <div className="space-y-6 lg:col-span-1">
                        <Card className="gap-0 py-0">
                            <CardContent className="space-y-4 p-6">
                                <div className="flex items-start gap-4">
                                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                        <Mail className="size-5 text-primary" aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="text-lg font-semibold">Email support</h2>
                                        <a
                                            href={`mailto:${supportEmail}`}
                                            className="mt-1 inline-flex min-h-8 items-center break-all font-medium text-primary underline-offset-4 hover:underline"
                                        >
                                            {supportEmail}
                                        </a>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            We reply by email as soon as we can, usually within two business days.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="gap-0 py-0">
                            <CardContent className="p-6">
                                <h2 className="text-lg font-semibold">Quick help</h2>
                                <ul className="mt-3 space-y-1">
                                    {helpLinks.map((link) => (
                                        <li key={link.label}>
                                            <Link
                                                href={link.href}
                                                className="flex min-h-10 items-center gap-3 rounded-md text-sm font-medium text-foreground hover:text-primary"
                                                {...verificationPortalLinkProps(link.href)}
                                            >
                                                <link.icon className="size-4 text-muted-foreground" aria-hidden="true" />
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contact form */}
                    <Card className="gap-0 py-0 lg:col-span-2">
                        <CardContent className="p-6 sm:p-8">
                            <h2 className="text-2xl font-semibold tracking-tight">Send us a message</h2>
                            <p className="mt-2 text-muted-foreground">
                                Fill in the form and we&apos;ll open a pre-written email in your mail app, addressed to our
                                support team.
                            </p>
                            <div className="mt-8">
                                <ContactForm supportEmail={supportEmail} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
