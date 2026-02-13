"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Ban, ShieldCheck, UserX } from "lucide-react";
import { banMember, getCommunityMembers, unbanMember } from "@/app/actions/community";
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <UserX className="h-4 w-4" />
                    Manage Members
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Community Members</DialogTitle>
                    <DialogDescription>
                        Manage active members and banned users.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="members" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="members">Active Members ({members.length})</TabsTrigger>
                        <TabsTrigger value="banned">Banned Users ({bannedUsers.length})</TabsTrigger>
                    </TabsList>

                    <div className="mt-4 max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <>
                                <TabsContent value="members" className="space-y-4">
                                    {members.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-4">No members found.</p>
                                    ) : (
                                        members.map((member) => (
                                            <div key={member.user.id} className="flex items-center justify-between p-2 border rounded-md">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={member.user.image || ""} />
                                                        <AvatarFallback>{member.user.name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-sm">{member.user.name}</p>
                                                        <p className="text-xs text-muted-foreground">{member.user.email}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleBan(member.user.id)}
                                                >
                                                    <Ban className="h-4 w-4 mr-1" />
                                                    Ban
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </TabsContent>

                                <TabsContent value="banned" className="space-y-4">
                                    {bannedUsers.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-4">No banned users.</p>
                                    ) : (
                                        bannedUsers.map((ban) => (
                                            <div key={ban.user.id} className="flex items-center justify-between p-2 border rounded-md bg-destructive/5">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={ban.user.image || ""} />
                                                        <AvatarFallback>{ban.user.name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-sm">{ban.user.name}</p>
                                                        <p className="text-xs text-muted-foreground">{ban.user.email}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => handleUnban(ban.user.id)}
                                                >
                                                    <ShieldCheck className="h-4 w-4 mr-1" />
                                                    Unban
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </TabsContent>
                            </>
                        )}
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
