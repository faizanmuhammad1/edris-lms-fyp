"use client";

import * as React from "react";
import {
  IconChartBar,
  // IconChartBar removed here to fix duplicate
  IconDashboard,
  IconFileDescription,
  IconListDetails,
  IconSettings,
  IconUsers,
  IconMessageCircle,
  IconChartLine,
  IconSchool,
  type Icon,
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

// Default data for Admin - Admin-specific power features
const adminData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: IconDashboard,
    },
    {
      title: "User Management",
      url: "/admin/users",
      icon: IconUsers,
    },
    {
      title: "Teacher Management",
      url: "/admin/teachers",
      icon: IconSchool,
    },
    {
      title: "Course Management",
      url: "/admin/courses",
      icon: IconListDetails,
    },
    {
      title: "Revenue Earnings",
      url: "/admin/analytics",
      icon: IconChartBar,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/admin/settings",
      icon: IconSettings,
    },
  ],
};

const teacherData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/teacher",
      icon: IconDashboard,
    },
    {
      title: "Courses",
      url: "/teacher/courses",
      icon: IconListDetails,
    },
    {
      title: "Quizzes",
      url: "/teacher/quizzes",
      icon: IconFileDescription, // Using FileDescription as Pencil is not imported yet, or I should import it.
    },
    {
      title: "Students",
      url: "/teacher/students",
      icon: IconUsers,
    },
    {
      title: "Quiz attempts",
      url: "/teacher/quiz-attempts",
      icon: IconChartLine,
    },
    {
      title: "Communities",
      url: "/teacher/communities",
      icon: IconMessageCircle,
    },
    {
      title: "Analytics",
      url: "/teacher/analytics",
      icon: IconChartBar,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/teacher/settings",
      icon: IconSettings,
    },
  ],
};

// Define props interface
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role?: "admin" | "teacher";
  navMain?: {
    title: string;
    url: string;
    icon: Icon;
    isActive?: boolean;
    items?: { title: string; url: string }[];
  }[];
  navSecondary?: {
    title: string;
    url: string;
    icon: Icon;
    items?: { title: string; url: string }[];
  }[];
}

export function AppSidebar({ role = "admin", navMain, navSecondary, ...props }: AppSidebarProps) {
  // Use passed props, or fallback to role-based defaults
  const data = role === "teacher" ? teacherData : adminData;
  const mainItems = navMain || data.navMain;
  const secondaryItems = navSecondary || data.navSecondary;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <Image src={Logo} alt="Logo" className="size-8" />
                <span className="text-lg font-semibold">Edris LMS</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainItems} />

        <NavSecondary items={secondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
