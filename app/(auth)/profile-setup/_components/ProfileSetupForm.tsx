"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateUserProfile } from "../actions";

export function ProfileSetupForm({ nextUrl }: { nextUrl: string }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    function handleSubmit(formData: FormData) {
        setError(null);
        startTransition(async () => {
            const result = await updateUserProfile(formData);

            if (result.status === "success") {
                toast.success(result.message);
                router.push(nextUrl);
            } else {
                setError(result.message);
                toast.error(result.message);
            }
        });
    }

    return (
        <Card className="w-full">
            <CardHeader className="text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Complete your profile</h1>
                <CardDescription className="text-base">
                    What should we call you? Your name appears on your certificates.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full name</Label>
                        <Input
                            id="name"
                            name="name"
                            autoComplete="name"
                            autoCapitalize="words"
                            placeholder="e.g. Sara Ahmed"
                            required
                            minLength={2}
                            maxLength={100}
                            disabled={pending}
                            aria-invalid={error ? true : undefined}
                            aria-describedby={error ? "name-error" : undefined}
                            className="h-11"
                        />
                    </div>

                    {error && (
                        <p id="name-error" role="alert" className="flex items-start gap-2 text-sm text-destructive">
                            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            {error}
                        </p>
                    )}

                    <Button type="submit" disabled={pending} className="h-11 w-full">
                        {pending ? (
                            <>
                                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                Saving…
                            </>
                        ) : (
                            "Continue"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
