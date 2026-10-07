"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, LogOut, Check, UserPlus } from "lucide-react";
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
  /** Used in accessible names, e.g. "Join React Learners". */
  communityName?: string;
}

export function CommunityJoinButton({ communityId, isMember, className, communityName }: CommunityJoinButtonProps) {
  const [pending, startTransition] = useTransition();
  const nameSuffix = communityName ? ` ${communityName}` : "";

  const handleJoin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    startTransition(async () => {
      try {
        const result = await joinCommunity(communityId);
        if (!result.success) {
          toast.error(result.error || "We couldn't join this community. Please try again.");
        } else {
          toast.success(communityName ? `You joined ${communityName}` : "You joined the community");
        }
      } catch {
        toast.error("We couldn't join this community. Please try again.");
      }
    });
  };

  const handleLeave = () => {
    if (pending) return;
    startTransition(async () => {
      try {
        const result = await leaveCommunity(communityId);
        if (!result.success) {
          toast.error(result.error || "We couldn't leave this community. Please try again.");
        } else {
          toast.success(communityName ? `You left ${communityName}` : "You left the community");
        }
      } catch {
        toast.error("We couldn't leave this community. Please try again.");
      }
    });
  };

  if (isMember) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            className={cn(
              "w-full justify-between border-emerald-500/30 bg-emerald-500/10 text-emerald-800 hover:scale-100 hover:bg-emerald-500/20 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-200",
              className
            )}
            disabled={pending}
            aria-busy={pending}
            aria-label={`Joined${nameSuffix}. Open membership options`}
          >
            <span className="inline-flex items-center gap-2">
              {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
              {pending ? "Updating…" : "Joined"}
            </span>
            <ChevronDown className="opacity-60" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[--radix-dropdown-menu-trigger-width] min-w-48">
          <DropdownMenuItem onSelect={handleLeave} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut aria-hidden="true" />
            Leave community
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      variant="default"
      size="lg"
      className={cn("w-full", className)}
      onClick={handleJoin}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <UserPlus aria-hidden="true" />}
      {pending ? "Joining…" : "Join community"}
      {!pending && communityName && <span className="sr-only">{nameSuffix}</span>}
    </Button>
  );
}
