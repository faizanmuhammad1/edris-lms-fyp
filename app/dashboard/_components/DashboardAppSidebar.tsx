"use client";

import * as React from "react";
import {
  IconDashboard,
  IconFileDescription,
  IconSettings,
  IconCertificate,
  IconMessageCircle,
  IconHeadset,
} from "@tabler/icons-react";
import Logo from "@/public/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
  },
  {
    title: "My Courses",
    url: "/dashboard/courses",
    icon: IconFileDescription,
  },
  {
    title: "Certificates",
    url: "/dashboard/certificates",
    icon: IconCertificate,
  },
  {
    title: "Community Forum",
    url: "/dashboard/forum",
    icon: IconMessageCircle,
  },
];

const navSecondary = [
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: IconSettings,
  },
  {
    title: "Support & Help",
    url: "/dashboard/support",
    icon: IconHeadset,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/">
                <Image src={Logo} alt="" className="size-8" />
                <span className="text-lg font-semibold">Edris LMS</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />

        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
