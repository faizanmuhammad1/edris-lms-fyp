import Image from "next/image";
import Link from "next/link";
import { CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import Logo from "@/public/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png";
import WhiteLogo from "@/public/edriswhitelogo.png";
import {
  verificationPortalLinkProps,
  verificationPortalUrl,
} from "@/lib/verification-portal-url";
import { NewsletterSubscribe } from "./NewsletterSubscribe";

const categoryHref = (category: string) => `/courses?category=${encodeURIComponent(category)}`;

const linkGroups = [
  {
    title: "Learn",
    links: [
      { label: "All courses", href: "/courses" },
      ...["Development", "Business", "Design", "IT & Software"].map((category) => ({
        label: category,
        href: categoryHref(category),
      })),
    ],
  },
  {
    title: "Teach",
    links: [
      { label: "Become an instructor", href: "/teach" },
      { label: "Instructor dashboard", href: "/teacher" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "My learning", href: "/dashboard" },
      { label: "Verify a certificate", href: verificationPortalUrl() },
      { label: "Contact us", href: "/contact" },
    ],
  },
];

const legalLinks = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Cookies", href: "/cookies" },
  { label: "Accessibility", href: "/accessibility" },
];

const highlights = [
  { icon: Sparkles, text: "An AI tutor that knows every lesson" },
  { icon: ShieldCheck, text: "Certificates verified on the blockchain" },
  { icon: CreditCard, text: "Secure checkout with Stripe" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Newsletter */}
        <section
          aria-labelledby="footer-newsletter-heading"
          className="mt-12 grid gap-6 rounded-2xl border bg-card p-6 shadow-sm sm:p-8 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-center lg:gap-12 lg:p-10"
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Newsletter</p>
            <h2
              id="footer-newsletter-heading"
              className="mt-2 text-xl font-semibold tracking-tight text-balance sm:text-2xl"
            >
              New courses and learning tips, straight to your inbox
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              One email when there&apos;s something worth reading. Unsubscribe at any time.
            </p>
          </div>
          <NewsletterSubscribe />
        </section>

        {/* Brand + links */}
        <div className="grid gap-10 py-12 lg:grid-cols-12 lg:gap-8 lg:py-16">
          <div className="lg:col-span-5 xl:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5 rounded-md" aria-label="Edris LMS home">
              <Image src={Logo} alt="" className="h-9 w-auto dark:hidden" sizes="36px" />
              <Image src={WhiteLogo} alt="" className="hidden h-9 w-auto dark:block" sizes="36px" />
              <span className="text-lg font-semibold tracking-tight">Edris LMS</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Expert-led video courses with quizzes, assignments and an AI tutor, and certificates anyone can
              verify.
            </p>
            <ul className="mt-6 space-y-2.5">
              {highlights.map((item) => (
                <li key={item.text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <item.icon className="size-4 text-primary" aria-hidden="true" />
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-7 lg:col-start-6 xl:col-span-6 xl:col-start-7">
            {linkGroups.map((group) => (
              <nav
                key={group.title}
                aria-labelledby={`footer-${group.title.toLowerCase()}`}
                className="min-w-0"
              >
                <h3 id={`footer-${group.title.toLowerCase()}`} className="text-sm font-semibold text-foreground">
                  {group.title}
                </h3>
                <ul className="mt-3 space-y-0.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="inline-flex min-h-10 items-center text-sm text-muted-foreground transition-colors hover:text-foreground sm:min-h-9"
                        {...verificationPortalLinkProps(link.href)}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col-reverse gap-3 border-t py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {currentYear} Edris LMS. All rights reserved.</p>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-10 items-center transition-colors hover:text-foreground sm:min-h-8"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
