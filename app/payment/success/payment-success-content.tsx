"use client";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConfetti } from "@/hooks/use-confetti";
import { ArrowLeft, CheckIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface PaymentSuccessContentProps {
  reconciled: boolean;
}

export function PaymentSuccessContent({ reconciled }: PaymentSuccessContentProps) {
  const { triggerConfetti } = useConfetti();

  useEffect(() => {
    triggerConfetti();
  }, [triggerConfetti]);

  return (
    <div className="w-full min-h-screen flex flex-1 justify-center items-center">
      <Card className="w-[380px]">
        <CardContent>
          <div className="w-full flex justify-center">
            <CheckIcon className="size-12 p-2 bg-green-500/30 text-green-500 rounded-full" />
          </div>
          <div className="mt-3 text-center sm:mt-5 w-full">
            <h2 className="text-xl font-semibold">Payment Successful</h2>
            <p className="text-sm mt-2 text-muted-foreground tracking-tight text-balance">
              {reconciled
                ? "Payment confirmed and course access is now active."
                : "Payment was successful. If access is delayed, refresh dashboard in a few seconds."}
            </p>

            <div className="mt-4 w-full text-xs text-muted-foreground inline-flex items-center justify-center gap-2">
              {reconciled ? (
                <span>Enrollment synced</span>
              ) : (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  <span>Waiting for confirmation</span>
                </>
              )}
            </div>

            <Link
              href="/dashboard"
              className={buttonVariants({ className: "w-full mt-5" })}
            >
              <ArrowLeft className="size-4" />
              Go to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
