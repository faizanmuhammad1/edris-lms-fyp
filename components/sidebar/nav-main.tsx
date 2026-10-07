"use client";

import { IconCirclePlusFilled, type Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Area roots ("/admin", "/teacher", "/dashboard") only match exactly; other items also match their sub-pages. */
const AREA_ROOTS = new Set(["/admin", "/teacher", "/dashboard"]);

export function isNavItemActive(pathname: string, url: string) {
  if (pathname === url) return true;
  if (AREA_ROOTS.has(url) || url === "/") return false;
  return pathname.startsWith(`${url}/`);
}

const quickCreateClass =
  "bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground active:bg-primary-hover active:text-primary-foreground min-w-8 h-10 md:h-8 duration-200 ease-linear";

const activeClass =
  "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:hover:bg-primary-hover data-[active=true]:hover:text-primary-foreground";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) {
  const pathname = usePathname() ?? "";
  const { isMobile, setOpenMobile } = useSidebar();
  // Close the off-canvas sheet after navigating on phones.
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {pathname.startsWith("/teacher") && (
          <SidebarMenu aria-label="Quick create">
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton asChild tooltip="Create Course" className={quickCreateClass}>
                <Link href="/teacher/courses/create" onClick={closeOnMobile}>
                  <IconCirclePlusFilled aria-hidden="true" />
                  <span>Create Course</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton asChild tooltip="Create Community" className={quickCreateClass}>
                <Link href="/teacher/communities/create" onClick={closeOnMobile}>
                  <IconCirclePlusFilled aria-hidden="true" />
                  <span>Create Community</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <nav aria-label="Main navigation">
          <SidebarMenu>
            {items.map((item) => {
              const active = isNavItemActive(pathname, item.url);
              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    asChild
                    isActive={active}
                    className={cn("h-10 md:h-8", activeClass)}
                  >
                    <Link
                      href={item.url}
                      aria-current={active ? "page" : undefined}
                      onClick={closeOnMobile}
                    >
                      {item.icon && <item.icon aria-hidden="true" />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </nav>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
