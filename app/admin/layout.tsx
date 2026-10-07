import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SiteHeader } from "@/components/sidebar/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";
import { Metadata } from "next";
import { requireAdmin } from "@/app/data/admin/require-admin";

export const metadata: Metadata = {
  title: "Admin",
  description: "Manage courses, users, and platform settings",
  // Private area: keep out of search engines.
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Redirects to /login (no session) or /not-admin (not an admin). Cached per
  // request, so pages calling requireAdmin() again don't repeat the lookup.
  await requireAdmin();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="min-w-0">
        <SiteHeader />
        <div className="@container/main flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
