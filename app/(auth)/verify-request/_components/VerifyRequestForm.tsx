"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth-client";
import { safeCallbackPath } from "@/lib/safe-redirect";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

/** Seconds to wait before another code can be requested. */
const RESEND_COOLDOWN = 60;

export function VerifyRequestForm() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailPending, startTranstion] = useTransition();
  const [resendPending, startResend] = useTransition();
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const params = useSearchParams();
  const email = params.get("email") as string;
  const callbackURL = safeCallbackPath(params.get("callbackURL"));
  const isOtpCompleted = otp.length === 6;

  const loginQuery = new URLSearchParams();
  if (email) loginQuery.set("email", email);
  if (callbackURL) loginQuery.set("callbackURL", callbackURL);
  const loginQueryString = loginQuery.toString();
  const loginHref = loginQueryString ? `/login?${loginQueryString}` : "/login";

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function verifyOtp(code: string = otp) {
    if (code.length !== 6 || emailPending) return;
    setError(null);
    startTranstion(async () => {
      await authClient.signIn.emailOtp({
        email: email,
        otp: code,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Email verified");
            // Redirect to profile setup for new users to enter their name
            // The profile-setup page will check if they already have a name and redirect appropriately
            router.push(
              callbackURL
                ? `/profile-setup?callbackURL=${encodeURIComponent(callbackURL)}`
                : "/profile-setup"
            );
          },
          onError: (ctx) => {
            const message =
              ctx.response?.status === 429
                ? "Too many attempts. Please wait a few minutes and try again."
                : ctx.error.message || "That code didn't work. Check it and try again.";
            setError(message);
            toast.error(message);
          },
        },
      });
    });
  }

  function resendCode() {
    if (!email || cooldown > 0) return;
    setError(null);
    startResend(async () => {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
        fetchOptions: {
          onSuccess: () => {
            setOtp("");
            setCooldown(RESEND_COOLDOWN);
            toast.success("A new code is on its way. Check your inbox.");
          },
          onError: (ctx) => {
            const message =
              ctx.response?.status === 429
                ? "You've requested several codes. Please wait a few minutes before trying again."
                : `We couldn't resend the code: ${ctx.error.message || "please try again."}`;
            setCooldown(RESEND_COOLDOWN);
            setError(message);
            toast.error(message);
          },
        },
      });
    });
  }

  if (!email) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
          <CardDescription className="text-base">
            We couldn&apos;t tell which email address to verify. Please start again from the sign-in page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={loginHref}
            className={buttonVariants({ className: "h-11 w-full" })}
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
        <CardDescription className="text-base">
          We sent a 6-digit code to <span className="break-all font-medium text-foreground">{email}</span>. Enter it
          below to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verifyOtp();
          }}
          className="space-y-6"
        >
          <div className="flex flex-col items-center gap-2">
            <label id="otp-label" htmlFor="otp" className="text-sm font-medium">
              Verification code
            </label>
            <InputOTP
              id="otp"
              value={otp}
              onChange={(value) => {
                setOtp(value);
                if (error) setError(null);
              }}
              onComplete={(value: string) => verifyOtp(value)}
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              disabled={emailPending}
              aria-labelledby="otp-label"
              aria-describedby={error ? "otp-error" : "otp-hint"}
              aria-invalid={error ? true : undefined}
              containerClassName="justify-center"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="size-9 text-base sm:size-11" />
                <InputOTPSlot index={1} className="size-9 text-base sm:size-11" />
                <InputOTPSlot index={2} className="size-9 text-base sm:size-11" />
              </InputOTPGroup>
              <InputOTPGroup>
                <InputOTPSlot index={3} className="size-9 text-base sm:size-11" />
                <InputOTPSlot index={4} className="size-9 text-base sm:size-11" />
                <InputOTPSlot index={5} className="size-9 text-base sm:size-11" />
              </InputOTPGroup>
            </InputOTP>
            {error ? (
              <p id="otp-error" role="alert" className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            ) : (
              <p id="otp-hint" className="text-sm text-muted-foreground">
                The code expires after a few minutes.
              </p>
            )}
          </div>

          <Button type="submit" disabled={emailPending || !isOtpCompleted} className="h-11 w-full">
            {emailPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span>Verifying…</span>
              </>
            ) : (
              "Verify and continue"
            )}
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-1 border-t pt-5 text-sm text-muted-foreground">
          <p>Didn&apos;t get the code? Check your spam folder, or</p>
          <Button
            type="button"
            variant="link"
            onClick={resendCode}
            disabled={resendPending || cooldown > 0}
            className="h-10 px-2"
            aria-live="polite"
          >
            {resendPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Sending a new code…
              </>
            ) : cooldown > 0 ? (
              `Resend code in ${cooldown}s`
            ) : (
              "Resend code"
            )}
          </Button>
          <Link href={loginHref} className="inline-flex min-h-10 items-center hover:text-primary hover:underline">
            Use a different email
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
