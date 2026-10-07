"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { updateUserProfile } from "../actions";

export function ProfileSetupForm({ nextUrl }: { nextUrl: string }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const result = await updateUserProfile(formData);

            if (result.status === "success") {
                toast.success(result.message);
                router.push(nextUrl);
            } else {
                toast.error(result.message);
            }
        });
    }

    return (
        <Card className="w-full mx-auto">
            <CardHeader className="text-center">
                <CardTitle className="text-xl">Complete Your Profile</CardTitle>
                <CardDescription>
                    Please enter your full name to get started
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Enter your full name"
                            required
                            minLength={2}
                            disabled={pending}
                        />
                    </div>

                    <Button type="submit" disabled={pending} className="w-full">
                        {pending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
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
