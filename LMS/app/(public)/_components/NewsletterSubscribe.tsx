"use client";

import { useState, useTransition } from "react";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeNewsletter } from "@/app/actions/newsletter";
import { toast } from "sonner";

export function NewsletterSubscribe() {
    const [email, setEmail] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const value = email.trim();
        if (!value) return;
        startTransition(async () => {
            const result = await subscribeNewsletter(value);
            if (!result.ok) {
                toast.error(result.error);
                return;
            }
            if (result.message === "already_confirmed") {
                toast.success("You're already subscribed.");
            } else if (result.message === "pending") {
                toast.success("Check your email to confirm your subscription.");
            } else {
                toast.success("Check your email to confirm your subscription.");
            }
            setEmail("");
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row w-full md:w-auto gap-2 flex-1 md:flex-initial">
            <div className="relative flex-1 md:w-64">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="email"
                    placeholder="Enter your email"
                    className="pl-9 h-10 bg-background"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isPending}
                    required
                    maxLength={320}
                />
            </div>
            <Button type="submit" className="h-10 shrink-0" disabled={isPending}>
                {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Subscribe
            </Button>
        </form>
    );
}
