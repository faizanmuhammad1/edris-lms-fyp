"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { pluralize } from "@/app/admin/_lib/format";
import { deleteCommunity, updateCommunity } from "@/app/actions/community";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;

const communitySchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, "Name must be at least 3 characters.")
        .max(NAME_MAX, `Name must be ${NAME_MAX} characters or fewer.`),
    description: z
        .string()
        .trim()
        .min(10, "Description must be at least 10 characters.")
        .max(DESCRIPTION_MAX, `Description must be ${DESCRIPTION_MAX} characters or fewer.`),
});

type CommunitySchemaType = z.infer<typeof communitySchema>;

interface EditCommunityFormProps {
    initialData: {
        name: string;
        description: string;
        slug: string;
        /** Optional counts used to explain what deleting removes. */
        _count?: { posts: number; members: number };
    };
    role: "admin" | "teacher";
}

/** Community details form plus a danger zone to delete the community. */
export function EditCommunityForm({ initialData, role }: EditCommunityFormProps) {
    const router = useRouter();
    const listHref = role === "admin" ? "/admin/communities" : "/teacher/communities";

    const form = useForm<CommunitySchemaType>({
        resolver: zodResolver(communitySchema),
        defaultValues: {
            name: initialData.name,
            description: initialData.description,
        },
        mode: "onTouched",
    });
    const { isDirty, isSubmitting } = form.formState;
    const descriptionLength = useWatch({ control: form.control, name: "description" }).length;

    async function onSubmit(values: CommunitySchemaType) {
        try {
            const result = await updateCommunity(initialData.slug, values);
            if (!result.success) {
                toast.error(result.error || "Couldn't update the community. Please try again.");
                return;
            }
            toast.success("Community details saved.");
            form.reset(values);
            router.refresh();
        } catch {
            toast.error("Couldn't update the community. Check your connection and try again.");
        }
    }

    async function onDelete(): Promise<boolean> {
        try {
            const result = await deleteCommunity(initialData.slug);
            if (!result.success) {
                toast.error(result.error || "Couldn't delete the community. Please try again.");
                return false;
            }
            toast.success(`“${initialData.name}” deleted.`);
            router.push(listHref);
            router.refresh();
            return true;
        } catch {
            toast.error("Couldn't delete the community. Check your connection and try again.");
            return false;
        }
    }

    const counts = initialData._count;
    const deleteConsequence = counts
        ? `${pluralize(counts.posts, "post")} (with their comments) and ${pluralize(counts.members, "membership", "memberships")}`
        : "all of its posts, comments, memberships and bans";

    return (
        <div className="space-y-6">
            <Card className="gap-5 shadow-xs">
                <CardHeader className="px-4 sm:px-6">
                    <h2 className="text-base font-semibold leading-tight sm:text-lg">Community details</h2>
                    <CardDescription>
                        Update the name and description members see. The community&apos;s web address stays the
                        same.
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                    <Form {...form}>
                        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
                            <fieldset className="space-y-6" disabled={isSubmitting}>
                                <legend className="sr-only">Community details</legend>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Community name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Web Development Discussion"
                                                    maxLength={NAME_MAX}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>3–{NAME_MAX} characters.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Describe what members can discuss here…"
                                                    className="min-h-32"
                                                    maxLength={DESCRIPTION_MAX}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="flex flex-wrap justify-between gap-x-4">
                                                <span>10–{DESCRIPTION_MAX} characters.</span>
                                                <span className="tabular-nums">
                                                    {descriptionLength}/{DESCRIPTION_MAX}
                                                </span>
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </fieldset>

                            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
                                <p className="text-xs text-muted-foreground sm:mr-auto" aria-live="polite">
                                    {isSubmitting
                                        ? "Saving…"
                                        : isDirty
                                          ? "You have unsaved changes."
                                          : "No unsaved changes."}
                                </p>
                                {isDirty && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => form.reset()}
                                        disabled={isSubmitting}
                                    >
                                        Discard changes
                                    </Button>
                                )}
                                <Button type="submit" disabled={!isDirty || isSubmitting} aria-busy={isSubmitting}>
                                    {isSubmitting ? (
                                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                    ) : (
                                        <Save className="size-4" aria-hidden="true" />
                                    )}
                                    {isSubmitting ? "Saving…" : "Save changes"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card className="gap-4 border-destructive/40 shadow-xs">
                <CardHeader className="px-4 sm:px-6">
                    <h2 className="text-base font-semibold leading-tight text-destructive sm:text-lg">
                        Danger zone
                    </h2>
                    <CardDescription>Irreversible actions for this community.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium">Delete this community</p>
                        <p className="text-sm text-muted-foreground">
                            Permanently removes the forum, {deleteConsequence}.
                        </p>
                    </div>
                    <ConfirmDialog
                        title="Delete this community?"
                        description={
                            <div className="space-y-2">
                                <p>
                                    <span className="font-medium text-foreground [overflow-wrap:anywhere]">
                                        &ldquo;{initialData.name}&rdquo;
                                    </span>{" "}
                                    will be permanently deleted together with {deleteConsequence}.
                                </p>
                                <p>Members lose access immediately. This can&apos;t be undone.</p>
                            </div>
                        }
                        confirmLabel="Delete community"
                        destructive
                        onConfirm={onDelete}
                        trigger={
                            <Button variant="destructive" className="w-full sm:w-auto sm:shrink-0">
                                <Trash2 className="size-4" aria-hidden="true" />
                                Delete community
                            </Button>
                        }
                    />
                </CardContent>
            </Card>
        </div>
    );
}
