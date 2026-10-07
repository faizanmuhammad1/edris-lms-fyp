"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tryCatch } from "@/hooks/try-catch";
import { updateTeacherProfile } from "../actions";

interface TeacherProfileFormProps {
    name: string;
    email: string;
}

export function TeacherProfileForm({ name: initialName, email }: TeacherProfileFormProps) {
    const [name, setName] = useState(initialName);
    const [pending, startTransition] = useTransition();

    function onSave() {
        startTransition(async () => {
            const { data: result, error } = await tryCatch(updateTeacherProfile({ name }));
            if (error || !result) {
                toast.error("An unexpected error occurred. Please try again.");
                return;
            }
            if (result.status === "success") {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        });
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={email} disabled />
                    <p className="text-xs text-muted-foreground">
                        Contact support to change email
                    </p>
                </div>
            </div>

            <Button onClick={onSave} disabled={pending || name.trim() === initialName.trim()}>
                {pending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Save Profile
            </Button>
        </>
    );
}
