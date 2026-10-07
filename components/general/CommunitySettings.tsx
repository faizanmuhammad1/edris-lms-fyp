"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateCommunity } from "@/app/actions/community";
import { getCommunityMembers } from "@/app/actions/get-community-members";
import { removeMemberFromCommunity } from "@/app/actions/moderation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Settings, Save, UserX } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const communitySchema = z.object({
    name: z.string().min(3).max(100),
    description: z.string().min(10).max(500),
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

export function CommunitySettings({ community }: CommunitySettingsProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("general");
    const [members, setMembers] = useState<Member[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<CommunitySchemaType>({
        resolver: zodResolver(communitySchema),
        defaultValues: {
            name: community.name,
            description: community.description,
        },
    });

    const fetchMembers = useCallback(async () => {
        setLoadingMembers(true);
        try {
            const result = await getCommunityMembers(community.id);
            if (result.success) {
                setMembers(result.data);
            } else {
                toast.error(result.error || "Failed to load members");
            }
        } catch {
            toast.error("Failed to load members");
        } finally {
            setLoadingMembers(false);
        }
    }, [community.id]);

    useEffect(() => {
        if (open && activeTab === "members") {
            fetchMembers();
        }
    }, [open, activeTab, fetchMembers]);

    function onSubmit(values: CommunitySchemaType) {
        startTransition(async () => {
            const result = await updateCommunity(community.slug, values);

            if (!result.success) {
                toast.error(result.error || "Failed to update community");
                return;
            }

            toast.success("Community updated successfully!");
            router.refresh();
            setOpen(false);
        });
    }

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm("Are you sure you want to remove this member? This will unenroll them from the course.")) return;

        try {
            const result = await removeMemberFromCommunity(community.id, memberId);
            if (result.success) {
                toast.success(result.message || "Member removed successfully");
                setMembers(members.filter(m => m.id !== memberId));
                router.refresh();
            } else {
                toast.error(result.error || "Failed to remove member");
            }
        } catch {
            toast.error("An error occurred");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Manage Community
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Community Settings</DialogTitle>
                    <DialogDescription>
                        Manage your community details and members.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="members">Members</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4 py-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
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
                                                <Textarea {...field} className="min-h-[100px]" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={pending}>
                                        {pending ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" /> Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </TabsContent>

                    <TabsContent value="members" className="space-y-4 py-4">
                        <div className="flex-1 overflow-hidden flex flex-col">
                            {loadingMembers ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : members.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No members found.</p>
                            ) : (
                                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                    {members.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={member.image || ""} />
                                                    <AvatarFallback>
                                                        {member.name?.[0] || "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm line-clamp-1">{member.name}</span>
                                                    <span className="text-xs text-muted-foreground line-clamp-1">{member.email}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    title="Remove from community (Unenroll)"
                                                >
                                                    <UserX className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
