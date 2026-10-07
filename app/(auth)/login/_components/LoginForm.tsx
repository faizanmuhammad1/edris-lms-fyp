"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { safeCallbackPath } from "@/lib/safe-redirect";

import { AlertCircle, Loader2, Send } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = safeCallbackPath(searchParams.get("callbackURL"));
  const [emailPending, startEmailTransition] = useTransition();
  const [googlePending, startGoogleTransition] = useTransition();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [error, setError] = useState<string | null>(null);

  function signInWithEmail(e?: React.FormEvent) {
    e?.preventDefault();
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setError("Enter a valid email address, like name@example.com.");
      return;
    }
    setError(null);

    startEmailTransition(async () => {
      await authClient.emailOtp.sendVerificationOtp({
        email: value,
        type: "sign-in",
        fetchOptions: {
          onSuccess: () => {
            toast.success("We've emailed you a sign-in code");
            // Pass callbackURL to verify-request page so it can be preserved.
            // Encode the email: a raw "+" would otherwise be read back as a space.
            const query = new URLSearchParams({ email: value });
            if (callbackURL) query.set("callbackURL", callbackURL);
            router.push(`/verify-request?${query.toString()}`);
          },
          onError: (ctx) => {
            console.error("Login error:", ctx);
            const message =
              ctx.response?.status === 429
                ? "Too many attempts. Please wait a few minutes and try again."
                : `We couldn't send the email: ${ctx.error.message || "please try again."}`;
            setError(message);
            toast.error(message);
          },
        },
      });
    });
  }

  function signInWithGoogle() {
    setError(null);
    startGoogleTransition(async () => {
      await authClient.signIn.social({
        provider: "google",
        // /login routes signed-in users to /admin, /teacher or /dashboard by role.
        callbackURL: callbackURL || "/login",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signing in with Google...");
            // The callbackURL in signIn.social handles the redirect for social login
          },
          onError: () => {
            setError("Google sign-in failed. Please try again or use your email.");
            toast.error("Error signing in with Google");
          },
        },
      });
    });
  }

  const busy = emailPending || googlePending;

  return (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to Edris LMS</h1>
        <CardDescription className="text-base">
          Sign in or create an account — we&apos;ll email you a one-time code.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <form onSubmit={signInWithEmail} noValidate className="flex flex-col gap-3">
          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@example.com"
              required
              disabled={emailPending}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "login-error" : undefined}
              className="h-11"
            />
          </div>

          {error && (
            <p id="login-error" role="alert" className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          <Button type="submit" disabled={busy} className="h-11">
            {emailPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span>Sending code…</span>
              </>
            ) : (
              <>
                <Send className="size-4" aria-hidden="true" />
                <span>Continue with email</span>
              </>
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <span className="w-full border-t" />
          </div>
          <p className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </p>
        </div>

        <Button
          type="button"
          onClick={signInWithGoogle}
          disabled={busy}
          variant="outline"
          className="h-11 w-full"
        >
          {googlePending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span>Redirecting to Google…</span>
            </>
          ) : (
            <>
              <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
