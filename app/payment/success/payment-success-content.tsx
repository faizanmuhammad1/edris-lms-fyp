"use client";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConfetti } from "@/hooks/use-confetti";
import { ArrowRight, CheckIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface PaymentSuccessContentProps {
  reconciled: boolean;
}

export function PaymentSuccessContent({ reconciled }: PaymentSuccessContentProps) {
  const { triggerConfetti } = useConfetti();
  const router = useRouter();
  const celebrated = useRef(false);

  useEffect(() => {
    // Celebrate once, and skip the animation for people who prefer reduced motion.
    if (celebrated.current) return;
    celebrated.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    triggerConfetti();
  }, [triggerConfetti]);

  const goToDashboard = () => {
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardContent className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-500/15">
            <CheckIcon className="size-7 text-green-600 dark:text-green-400" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Payment successful</h1>
          <p className="mt-2 text-sm text-muted-foreground text-balance">
            {reconciled
              ? "Payment confirmed — your course access is now active."
              : "Your payment went through. If a course doesn't appear right away, refresh your dashboard in a few seconds."}
          </p>

          <p
            role="status"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 text-xs text-muted-foreground"
          >
            {reconciled ? (
              <span>Enrollment synced</span>
            ) : (
              <>
                <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                <span>Waiting for confirmation</span>
              </>
            )}
          </p>

          <button
            type="button"
            onClick={goToDashboard}
            className={buttonVariants({ className: "mt-6 h-11 w-full" })}
          >
            Go to my dashboard
            <ArrowRight aria-hidden="true" />
          </button>
        </CardContent>
      </Card>
    </main>
  );
}
