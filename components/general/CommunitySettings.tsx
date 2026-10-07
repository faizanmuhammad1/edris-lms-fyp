"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Save, Settings, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateCommunity } from "@/app/actions/community";
import { getCommunityMembers } from "@/app/actions/get-community-members";
import { removeMemberFromCommunity } from "@/app/actions/moderation";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const communitySchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, "Name must be at least 3 characters.")
        .max(100, "Name must be 100 characters or fewer."),
    description: z
        .string()
        .trim()
        .min(10, "Description must be at least 10 characters.")
        .max(500, "Description must be 500 characters or fewer."),
});

type CommunitySchemaType = z.infer<typeof communitySchema>;

interface Member {
    id: string;
    name: string;
    email: string;
    image: string | null;
}

interface CommunitySettingsProps {
    community: {
        id: string;
        name: string;
        description: string;
        slug: string;
        courseId: string | null;
    };
}

function initials(name: string | null | undefined) {
    return (name ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";
}

/** Dialog for editing a community's details and managing its course's enrolled members. */
export function CommunitySettings({ community }: CommunitySettingsProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("general");
    const [members, setMembers] = useState<Member[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [membersError, setMembersError] = useState<string | null>(null);
    const router = useRouter();

    const form = useForm<CommunitySchemaType>({
        resolver: zodResolver(communitySchema),
        defaultValues: {
            name: community.name,
            description: community.description,
        },
        mode: "onTouched",
    });
    const { isDirty, isSubmitting } = form.formState;

    const fetchMembers = useCallback(async () => {
        setLoadingMembers(true);
        setMembersError(null);
        try {
            const result = await getCommunityMembers(community.id);
            if (result.success) {
                setMembers(result.data);
            } else {
                setMembersError(result.error || "Couldn't load members.");
            }
        } catch {
            setMembersError("Couldn't load members. Check your connection and try again.");
        } finally {
            setLoadingMembers(false);
        }
    }, [community.id]);

    useEffect(() => {
        if (open && activeTab === "members") {
            fetchMembers();
        }
    }, [open, activeTab, fetchMembers]);

    async function onSubmit(values: CommunitySchemaType) {
        try {
            const result = await updateCommunity(community.slug, values);
            if (!result.success) {
                toast.error(result.error || "Couldn't update the community. Please try again.");
                return;
            }
            toast.success("Community details saved.");
            form.reset(values);
            router.refresh();
            setOpen(false);
        } catch {
            toast.error("Couldn't update the community. Check your connection and try again.");
        }
    }

    async function handleRemoveMember(member: Member): Promise<boolean> {
        try {
            const result = await removeMemberFromCommunity(community.id, member.id);
            if (!result.success) {
                toast.error(result.error || "Couldn't remove the member. Please try again.");
                return false;
            }
            toast.success(result.message || `${member.name} was removed.`);
            setMembers((current) => current.filter((m) => m.id !== member.id));
            router.refresh();
            return true;
        } catch {
            toast.error("Couldn't remove the member. Check your connection and try again.");
            return false;
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Settings className="size-4" aria-hidden="true" />
                    Manage community
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Community settings</DialogTitle>
                    <DialogDescription>Edit the community details and manage enrolled members.</DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
                    <TabsList className="grid h-10 w-full grid-cols-2">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="members">Members</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="pt-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                                <fieldset className="space-y-4" disabled={isSubmitting}>
                                    <legend className="sr-only">Community details</legend>
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Community name</FormLabel>
                                                <FormControl>
                                                    <Input maxLength={100} {...field} />
                                                </FormControl>
                                                <FormDescription>3–100 characters.</FormDescription>
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
                                                    <Textarea maxLength={500} className="min-h-28" {...field} />
                                                </FormControl>
                                                <FormDescription>10–500 characters.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </fieldset>
                                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setOpen(false)}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
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
                    </TabsContent>

                    <TabsContent value="members" className="pt-4">
                        {loadingMembers ? (
                            <div role="status" aria-live="polite" className="space-y-2">
                                <span className="sr-only">Loading members…</span>
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 rounded-lg border p-3" aria-hidden="true">
                                        <Skeleton className="size-9 rounded-full" />
                                        <div className="flex-1 space-y-1.5">
                                            <Skeleton className="h-4 w-1/2" />
                                            <Skeleton className="h-3 w-2/3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : membersError ? (
                            <div role="alert" className="space-y-3 rounded-lg border border-destructive/30 p-4 text-sm">
                                <p className="flex items-start gap-2 text-destructive">
                                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                    {membersError}
                                </p>
                                <Button variant="outline" onClick={fetchMembers}>
                                    Try again
                                </Button>
                            </div>
                        ) : members.length === 0 ? (
                            <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                                {community.courseId
                                    ? "No students are enrolled in this community's course yet."
                                    : "This community isn't linked to a course, so there are no enrolled members to manage."}
                            </p>
                        ) : (
                            <ul className="space-y-2" aria-label="Enrolled members">
                                {members.map((member) => (
                                    <li
                                        key={member.id}
                                        className="flex items-center gap-3 rounded-lg border bg-card/50 p-3"
                                    >
                                        <Avatar className="size-9 shrink-0">
                                            <AvatarImage src={member.image ?? undefined} alt="" />
                                            <AvatarFallback className="text-xs">{initials(member.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{member.name}</p>
                                            <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                                        </div>
                                        <ConfirmDialog
                                            title={`Remove ${member.name}?`}
                                            description={`${member.name}'s course enrollment will be deleted, so they lose access to the course and this community. They would need to enroll again to come back. This can't be undone.`}
                                            confirmLabel="Remove member"
                                            destructive
                                            onConfirm={() => handleRemoveMember(member)}
                                            trigger={
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                    aria-label={`Remove ${member.name} (unenroll)`}
                                                    title="Remove from community (unenroll)"
                                                >
                                                    <UserX className="size-4" aria-hidden="true" />
                                                </Button>
                                            }
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
