"use client";

import { updateCommunity, deleteCommunity } from "@/app/actions/community";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const communitySchema = z.object({
    name: z.string().min(3).max(100),
    description: z.string().min(10).max(500),
});

type CommunitySchemaType = z.infer<typeof communitySchema>;

interface EditCommunityFormProps {
    initialData: {
        name: string;
        description: string;
        slug: string;
    };
    role: "admin" | "teacher";
}

export function EditCommunityForm({ initialData, role }: EditCommunityFormProps) {
    const [pending, startTransition] = useTransition();
    const [deletePending, startDeleteTransition] = useTransition(); // Separate delete state
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const form = useForm<CommunitySchemaType>({
        resolver: zodResolver(communitySchema),
        defaultValues: {
            name: initialData.name,
            description: initialData.description,
        },
    });

    function onSubmit(values: CommunitySchemaType) {
        startTransition(async () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { data, error } = await updateCommunity(initialData.slug, values);

            if (error) {
                toast.error("Failed to update community");
                return;
            }

            toast.success("Community updated successfully!");
            router.refresh();
            // Optionally redirect or stay
        });
    }

    function onDelete() {
        // Prevent accidental double clicks
        if (deletePending) return;

        startDeleteTransition(async () => {
            const { data, error } = await deleteCommunity(initialData.slug);

            if (data?.success) {
                toast.success("Community deleted");
                router.push(role === "admin" ? "/admin/communities" : "/teacher/communities");
                router.refresh();
            } else if (error) {
                toast.error("Failed to delete community");
            }
        });
    }

    const backLink = role === "admin" ? "/admin/communities" : "/teacher/communities";

    return (
        <>
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the community
                            and remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                onDelete();
                            }}
                            disabled={deletePending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deletePending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href={backLink}
                        className={buttonVariants({
                            variant: "outline",
                            size: "icon",
                        })}
                    >
                        <ArrowLeft className="size-4" />
                    </Link>
                    <h1 className="text-2xl font-bold">Manage Community</h1>
                </div>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setOpen(true)}
                    disabled={deletePending}
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Community
                </Button>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Community Settings</CardTitle>
                    <CardDescription>
                        Update the basic information for this community
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Community Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Web Development Discussion" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe what this community is about..."
                                                className="min-h-[120px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" disabled={pending}>
                                {pending ? (
                                    <>
                                        Saving...
                                        <Loader2 className="animate-spin ml-1" />
                                    </>
                                ) : (
                                    <>
                                        Save Changes <Save className="ml-1" size={16} />
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </>
    );
}
