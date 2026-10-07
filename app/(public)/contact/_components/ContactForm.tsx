"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * There is no server-side contact inbox, so this form composes an email in the visitor's
 * own mail app (mailto:) instead of pretending to send. The address is always shown too.
 */
export function ContactForm({ supportEmail }: { supportEmail: string }) {
    const [opened, setOpened] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const name = String(data.get("name") ?? "").trim();
        const email = String(data.get("email") ?? "").trim();
        const subject = String(data.get("subject") ?? "").trim();
        const message = String(data.get("message") ?? "").trim();

        const body = `${message}\n\n— ${name}${email ? ` (${email})` : ""}`;
        const href = `mailto:${supportEmail}?subject=${encodeURIComponent(subject || "Question about Edris LMS")}&body=${encodeURIComponent(body)}`;
        window.location.href = href;
        setOpened(true);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="contact-name">Full name</Label>
                    <Input id="contact-name" name="name" autoComplete="name" required className="h-11" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contact-email">Email address</Label>
                    <Input
                        id="contact-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        required
                        className="h-11"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="contact-subject">Subject</Label>
                <Input id="contact-subject" name="subject" required maxLength={150} className="h-11" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                    id="contact-message"
                    name="message"
                    required
                    maxLength={4000}
                    className="min-h-40 resize-y"
                    aria-describedby="contact-message-hint"
                />
                <p id="contact-message-hint" className="text-sm text-muted-foreground">
                    Include your order or course details if your question is about a purchase.
                </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button type="submit" size="lg" className="h-11 w-full sm:w-auto">
                    <Send aria-hidden="true" />
                    Open in your email app
                </Button>
                <p className="text-sm text-muted-foreground">
                    Prefer to write directly?{" "}
                    <a href={`mailto:${supportEmail}`} className="font-medium text-primary underline-offset-4 hover:underline">
                        {supportEmail}
                    </a>
                </p>
            </div>

            <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
                {opened && (
                    <span className="inline-flex items-start gap-2">
                        <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                        Your email app should open with your message ready to send. If nothing happened, email us
                        at {supportEmail}.
                    </span>
                )}
            </p>
        </form>
    );
}
