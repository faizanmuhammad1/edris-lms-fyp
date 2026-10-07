"use client";

import { useId, useState, useTransition } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeNewsletter } from "@/app/actions/newsletter";
import { cn } from "@/lib/utils";

type Status = { type: "success" | "error"; message: string } | null;

export function NewsletterSubscribe({ className }: { className?: string }) {
    const inputId = useId();
    const messageId = `${inputId}-message`;
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<Status>(null);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const value = email.trim();
        if (!value) {
            setStatus({ type: "error", message: "Please enter your email address." });
            return;
        }
        setStatus(null);
        startTransition(async () => {
            try {
                const result = await subscribeNewsletter(value);
                if (!result.ok) {
                    setStatus({ type: "error", message: result.error });
                    toast.error(result.error);
                    return;
                }
                const message =
                    result.message === "already_confirmed"
                        ? "You're already subscribed. Thanks for reading!"
                        : "Almost done — check your inbox to confirm your subscription.";
                setStatus({ type: "success", message });
                toast.success(message);
                setEmail("");
            } catch {
                const message = "We couldn't subscribe you right now. Please try again.";
                setStatus({ type: "error", message });
                toast.error(message);
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} noValidate className={cn("w-full", className)}>
            <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                    <label htmlFor={inputId} className="sr-only">
                        Email address
                    </label>
                    <Mail
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <Input
                        id={inputId}
                        type="email"
                        name="email"
                        autoComplete="email"
                        inputMode="email"
                        placeholder="you@example.com"
                        className="h-11 bg-background pl-9"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isPending}
                        required
                        maxLength={320}
                        aria-invalid={status?.type === "error" || undefined}
                        aria-describedby={status ? messageId : undefined}
                    />
                </div>
                <Button type="submit" className="h-11 shrink-0 px-5" disabled={isPending}>
                    {isPending ? (
                        <>
                            <Loader2 className="animate-spin" aria-hidden="true" />
                            Subscribing…
                        </>
                    ) : (
                        "Subscribe"
                    )}
                </Button>
            </div>
            <p
                id={messageId}
                role="status"
                aria-live="polite"
                className={cn(
                    "mt-2 flex min-h-5 items-start gap-1.5 text-sm",
                    status?.type === "error" ? "text-destructive" : "text-muted-foreground"
                )}
            >
                {status?.type === "success" && (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                )}
                {status?.message}
            </p>
        </form>
    );
}
