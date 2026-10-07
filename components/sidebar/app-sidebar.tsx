"use client";

import * as React from "react";
import {
  IconChartBar,
  IconDashboard,
  IconFileDescription,
  IconListDetails,
  IconMail,
  IconSettings,
  IconUsers,
  IconMessageCircle,
  IconChartLine,
  IconSchool,
  IconHeadset,
  IconStar,
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
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";

type NavItem = {
  title: string;
  url: string;
  icon: Icon;
};

const adminData: { navMain: NavItem[]; navSecondary: NavItem[] } = {
  navMain: [
    { title: "Dashboard", url: "/admin", icon: IconDashboard },
    { title: "Users", url: "/admin/users", icon: IconUsers },
    { title: "Teachers", url: "/admin/teachers", icon: IconSchool },
    { title: "Courses", url: "/admin/courses", icon: IconListDetails },
    { title: "Student Progress", url: "/admin/student-progress", icon: IconChartLine },
    { title: "Communities", url: "/admin/communities", icon: IconMessageCircle },
    { title: "Revenue & Analytics", url: "/admin/analytics", icon: IconChartBar },
    { title: "Mail", url: "/admin/mail", icon: IconMail },
  ],
  navSecondary: [
    { title: "Settings", url: "/admin/settings", icon: IconSettings },
    { title: "Support Center", url: "/admin/support", icon: IconHeadset },
  ],
};

const teacherData: { navMain: NavItem[]; navSecondary: NavItem[] } = {
  navMain: [
    { title: "Dashboard", url: "/teacher", icon: IconDashboard },
    { title: "Courses", url: "/teacher/courses", icon: IconListDetails },
    { title: "Quizzes", url: "/teacher/quizzes", icon: IconFileDescription },
    { title: "Students", url: "/teacher/students", icon: IconUsers },
    { title: "Student Progress", url: "/teacher/student-progress", icon: IconChartLine },
    { title: "Communities", url: "/teacher/communities", icon: IconMessageCircle },
    { title: "Analytics", url: "/teacher/analytics", icon: IconChartBar },
    { title: "Reviews", url: "/teacher/reviews", icon: IconStar },
  ],
  navSecondary: [
    { title: "Settings", url: "/teacher/settings", icon: IconSettings },
    { title: "Support & Help", url: "/teacher/support", icon: IconHeadset },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role?: "admin" | "teacher";
  navMain?: (NavItem & { isActive?: boolean; items?: { title: string; url: string }[] })[];
  navSecondary?: (NavItem & { items?: { title: string; url: string }[] })[];
}

export function AppSidebar({ role = "admin", navMain, navSecondary, ...props }: AppSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar();
  // Use passed props, or fall back to role-based defaults.
  const data = role === "teacher" ? teacherData : adminData;
  const mainItems = navMain || data.navMain;
  const secondaryItems = navSecondary || data.navSecondary;

  return (
    <>
      {/* First focusable element: lets keyboard users jump past the navigation (target lives in SiteHeader). */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5 h-11">
                <Link
                  href="/"
                  aria-label="Edris LMS home"
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                  }}
                >
                  <Image src={Logo} alt="" className="size-8" priority />
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
    </>
  );
}
