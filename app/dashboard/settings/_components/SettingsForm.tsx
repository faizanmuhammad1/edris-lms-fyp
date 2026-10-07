"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateStudentProfile } from "../actions";
import { Loader2 } from "lucide-react";

interface SettingsFormProps {
    initialData: {
        name: string;
        email: string;
    };
}

export function SettingsForm({ initialData }: SettingsFormProps) {
    const [name, setName] = useState(initialData.name);
    const [pending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        startTransition(async () => {
            const result = await updateStudentProfile({ name });

            if (result.status === "success") {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                />
                <p className="text-xs text-muted-foreground">
                    This is your public display name.
                </p>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={initialData.email}
                    disabled
                    className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                    Contact support to change email.
                </p>
            </div>

            <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={pending}>
                    {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </form>
    );
}
