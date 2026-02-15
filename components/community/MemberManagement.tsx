"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Ban, ShieldCheck, UserX, AlertTriangle, Trash2 } from "lucide-react";
import { banMember, getCommunityMembers, unbanMember, removeMember } from "@/app/actions/community";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface MemberManagementProps {
    communityId: string;
}

interface User {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
}

interface Member {
    user: User;
}

interface BanRecord {
    user: User;
}

export function MemberManagement({ communityId }: MemberManagementProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<Member[]>([]);
    const [bannedUsers, setBannedUsers] = useState<BanRecord[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getCommunityMembers(communityId);
            setMembers(data.members);
            setBannedUsers(data.bans);
        } catch {
            toast.error("Failed to load members");
        } finally {
            setLoading(false);
        }
    }, [communityId]);

    useEffect(() => {
        if (open) {
            fetchData();
        }
    }, [open, fetchData]);

    const handleBan = async (userId: string) => {
        if (typeof window !== "undefined" && !window.confirm("Are you sure you want to ban this user? They will be removed from the community.")) return;

        try {
            const res = await banMember(communityId, userId);
            if (res.error) {
                toast.error((res.error as Error).message || "Failed to ban user");
            } else {
                toast.success("User banned successfully");
                fetchData();
            }
        } catch {
            toast.error("Something went wrong");
        }
    };

    const handleUnban = async (userId: string) => {
        try {
            const res = await unbanMember(communityId, userId);
            if (res.error) {
                toast.error((res.error as Error).message || "Failed to unban user");
            } else {
                toast.success("User unbanned successfully");
                fetchData();
            }
        } catch {
            toast.error("Something went wrong");
        }
    };

    const handleRemove = async (userId: string) => {
        if (typeof window !== "undefined" && !window.confirm("Are you sure you want to REMOVE this user? This will DELETE all their posts and comments in this community. This action cannot be undone.")) return;

        try {
            const res = await removeMember(communityId, userId);
            if (res.error) {
                toast.error((res.error as Error).message || "Failed to remove user");
            } else {
                toast.success("User removed and data cleaned up successfully");
                fetchData();
            }
        } catch {
            toast.error("Something went wrong");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <UserX className="h-4 w-4" />
                    Manage Members
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Community Members</DialogTitle>
                    <DialogDescription>
                        Manage active members, remove users, or ban them to restrict access.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="members" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="members">Active Members ({members.length})</TabsTrigger>
                        <TabsTrigger value="banned">Banned Users ({bannedUsers.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="members" className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : members.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No active members found.
                            </div>
                        ) : (
                            members.map((member) => (
                                <div key={member.user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={member.user.image || ""} />
                                            <AvatarFallback>{member.user.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{member.user.name}</p>
                                            <p className="text-sm text-muted-foreground">{member.user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleRemove(member.user.id)}
                                            title="Remove user and delete all their content"
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Remove
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                                            onClick={() => handleBan(member.user.id)}
                                            title="Ban user (keep content)"
                                        >
                                            <Ban className="h-4 w-4 mr-1" />
                                            Ban
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="banned" className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : bannedUsers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No banned users found.
                            </div>
                        ) : (
                            bannedUsers.map((record) => (
                                <div key={record.user.id} className="flex items-center justify-between p-3 border rounded-lg border-red-100 bg-red-50/30">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={record.user.image || ""} />
                                            <AvatarFallback>{record.user.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{record.user.name}</p>
                                            <p className="text-sm text-muted-foreground">{record.user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleRemove(record.user.id)}
                                            title="Permanently remove user and content"
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Remove
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleUnban(record.user.id)}
                                        >
                                            <ShieldCheck className="h-4 w-4 mr-1" />
                                            Unban
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
