"use client";
import { getAvatarUrl } from "@/lib/avatar";

import { IconDashboard, IconDotsVertical, IconLogout } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { Tv2 } from "lucide-react";
import { useSignOut } from "@/hooks/use-singout";

interface UserWithRole {
  role?: string;
  teacherStatus?: string;
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

/** Links for the account menu, based on the signed-in user's portal. */
function getPortalLinks(user: UserWithRole | undefined) {
  if (user?.role === "admin") {
    return { dashboard: "/admin", courses: "/admin/courses" };
  }
  if (user?.role === "teacher" || user?.teacherStatus === "Approved") {
    return { dashboard: "/teacher", courses: "/teacher/courses" };
  }
  return { dashboard: "/dashboard", courses: "/courses" };
}

export function NavUser() {
  const { isMobile, setOpenMobile } = useSidebar();
  const { data: session, isPending } = authClient.useSession();
  const handleSignOut = useSignOut();

  if (isPending) {
    // Same footprint as the loaded button, so the sidebar doesn't jump.
    return (
      <div className="flex h-12 items-center gap-2 p-2" role="status" aria-label="Loading account">
        <Skeleton className="size-8 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  if (!session) return null;

  const { user } = session;
  const displayName = user.name && user.name.length > 0 ? user.name : user.email.split("@")[0];
  const avatarSrc = user.image ?? getAvatarUrl(user.name);
  const links = getPortalLinks(user as UserWithRole);
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const identity = (
    <>
      {/* Decorative: the name is written next to it. */}
      <Avatar className="size-8 rounded-lg">
        <AvatarImage src={avatarSrc} alt="" />
        <AvatarFallback className="rounded-lg text-xs font-medium">{getInitials(displayName)}</AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{displayName}</span>
        <span className="truncate text-xs text-muted-foreground">{user.email}</span>
      </div>
    </>
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label={`Account menu for ${displayName}`}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {identity}
              <IconDotsVertical className="ml-auto size-4" aria-hidden="true" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">{identity}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={links.dashboard} onClick={closeOnMobile}>
                  <IconDashboard aria-hidden="true" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={links.courses} onClick={closeOnMobile}>
                  <Tv2 aria-hidden="true" />
                  Courses
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <IconLogout aria-hidden="true" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
