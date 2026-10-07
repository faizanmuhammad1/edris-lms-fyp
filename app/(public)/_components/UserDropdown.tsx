"use client";

import { getAvatarUrl } from "@/lib/avatar";
import {
  Award,
  BookOpen,
  ChevronDownIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  Settings,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

import { useSignOut } from "@/hooks/use-singout";

interface iAppProps {
  name: string;
  email: string;
  image: string;
}

const menuLinks = [
  { href: "/dashboard", label: "My learning", icon: LayoutDashboardIcon },
  { href: "/dashboard/certificates", label: "Certificates", icon: Award },
  { href: "/courses", label: "Browse courses", icon: BookOpen },
  { href: "/dashboard/settings", label: "Account settings", icon: Settings },
];

export function UserDropdown({ email, name, image }: iAppProps) {
  const handleSignOut = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 gap-1 rounded-full px-1 hover:bg-accent"
          aria-label={`Account menu for ${name}`}
        >
          <Avatar className="size-8">
            <AvatarImage src={image} alt="" />
            <AvatarFallback>
              <Image
                src={getAvatarUrl(name)}
                alt=""
                fill
                sizes="32px"
                className="object-cover"
              />
            </AvatarFallback>
          </Avatar>
          <ChevronDownIcon size={16} className="opacity-60" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-60 p-1.5">
        <DropdownMenuLabel className="flex min-w-0 flex-col gap-0.5 px-2 py-2">
          <span className="truncate text-sm font-semibold text-foreground">{name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {menuLinks.map((item) => (
            <DropdownMenuItem key={item.href} asChild className="min-h-9 cursor-pointer gap-2.5 rounded-md">
              <Link href={item.href}>
                <item.icon size={16} className="opacity-70" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="min-h-9 cursor-pointer gap-2.5 rounded-md">
          <LogOutIcon size={16} className="opacity-70" aria-hidden="true" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
