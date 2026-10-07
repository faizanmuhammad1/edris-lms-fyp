import type { Metadata } from "next";
import Link from "next/link";
import { MailX } from "lucide-react";
import { unsubscribeByToken } from "@/app/actions/newsletter";
import { redirect } from "next/navigation";
import { UnsubscribeForm } from "./_components/UnsubscribeForm";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { pageMetadata } from "../_lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Unsubscribe",
  description: "Stop receiving marketing emails from Edris LMS.",
  path: "/unsubscribe",
  noindex: true,
});

type Props = { searchParams: Promise<{ token?: string | string[]; email?: string | string[] }> };

export default async function UnsubscribePage({ searchParams }: Props) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : undefined;
  const email = typeof params.email === "string" ? params.email : undefined;

  // Legacy newsletter links: /unsubscribe?token=<subscriber token>
  if (token && !email) {
    const result = await unsubscribeByToken(token);
    if (result.ok) {
      redirect("/?unsubscribed=1");
    }
    redirect("/?unsubscribe=error");
  }

  // Campaign links: /unsubscribe?email=...&token=<signed token>. Ask for an
  // explicit click so link scanners that prefetch URLs don't unsubscribe people.
  const hasSignedLink = Boolean(email && token);

  return (
    <div className="mx-auto flex w-full max-w-md items-center px-4 py-16 sm:py-24">
      <Card className="w-full">
        <CardHeader>
          <span className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <MailX className="size-6 text-primary" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Unsubscribe</h1>
          <CardDescription className="text-base">
            {hasSignedLink
              ? "Confirm that you want to stop receiving marketing emails from Edris."
              : "To unsubscribe, use the “Unsubscribe” link at the bottom of any marketing email you received from Edris."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {email && token ? (
            <UnsubscribeForm email={email} token={token} />
          ) : (
            <Link href="/" className="inline-flex min-h-10 items-center text-sm font-medium text-primary hover:underline">
              Back to home
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
