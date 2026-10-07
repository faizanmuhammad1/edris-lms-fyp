import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, XIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Payment cancelled",
  robots: { index: false, follow: false },
};

export default function PaymentCancelled() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardContent className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10">
            <XIcon className="size-7 text-destructive" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Payment cancelled</h1>
          <p className="mt-2 text-sm text-muted-foreground text-balance">
            No worries — you haven&apos;t been charged. You can return to the course and try again whenever
            you&apos;re ready.
          </p>

          <div className="mt-6 grid gap-3">
            <Link href="/courses" className={buttonVariants({ className: "h-11 w-full" })}>
              <BookOpen aria-hidden="true" />
              Back to courses
            </Link>
            <Link href="/" className={buttonVariants({ variant: "outline", className: "h-11 w-full" })}>
              <ArrowLeft aria-hidden="true" />
              Go to homepage
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
