"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { joinCommunity, leaveCommunity } from "@/app/actions/community";
import { cn } from "@/lib/utils";

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

    const handleToggleMembership = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent bubbling if inside a card link
        e.stopPropagation();

        startTransition(async () => {
            try {
                if (isMember) {
                    const { error } = await leaveCommunity(communityId);
                    if (error) {
                        toast.error(error.message || "Failed to leave community");
                    } else {
                        toast.success("Left community");
                    }
                } else {
                    const { error } = await joinCommunity(communityId);
                    if (error) {
                        toast.error(error.message || "Failed to join community");
                    } else {
                        toast.success("Joined community");
                    }
                }
            } catch {
                toast.error("Something went wrong");
            }
        });
    };

    return (
        <Button
            variant={isMember ? "outline" : "default"}
            size="sm"
            className={cn("w-full transition-all", isMember && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-700", className)}
            onClick={handleToggleMembership}
            disabled={pending}
        >
            {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isMember ? (
                "Joined"
            ) : (
                "Join Community"
            )}
        </Button>
    );
}
