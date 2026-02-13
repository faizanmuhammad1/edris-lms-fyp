"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, LogOut } from "lucide-react";
import { toast } from "sonner";
import { joinCommunity, leaveCommunity } from "@/app/actions/community";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CommunityJoinButtonProps {
    communityId: string;
    isMember: boolean;
    className?: string;
}

export function CommunityJoinButton({
    communityId,
    isMember,
    className,
}: CommunityJoinButtonProps) {
    const [pending, startTransition] = useTransition();

    const handleJoin = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        startTransition(async () => {
            try {
                const { error } = await joinCommunity(communityId);
                if (error) {
                    toast.error(error.message || "Failed to join community");
                } else {
                    toast.success("Joined community");
                }
            } catch {
                toast.error("Something went wrong");
            }
        });
    };

    const handleLeave = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        startTransition(async () => {
            try {
                const { error } = await leaveCommunity(communityId);
                if (error) {
                    toast.error(error.message || "Failed to leave community");
                } else {
                    toast.success("Left community");
                }
            } catch {
                toast.error("Something went wrong");
            }
        });
    };

    if (isMember) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn("w-full transition-all bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-700 justify-between", className)}
                        disabled={pending}
                    >
                        {pending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                Joined
                                <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
                            </>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[--radix-dropdown-menu-trigger-width]">
                    <DropdownMenuItem
                        onClick={handleLeave}
                        className="text-destructive focus:text-destructive cursor-pointer"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Leave Community
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <Button
            variant="default"
            size="sm"
            className={cn("w-full", className)}
            onClick={handleJoin}
            disabled={pending}
        >
            {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                "Join Community"
            )}
        </Button>
    );
}
