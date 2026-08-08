import { AppSidebar } from "@/components/sidebar/app-sidebar";

import { SiteHeader } from "@/components/sidebar/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Manage courses, users, and platform settings",
};

async function getAdminUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });



  if (!session) {

    return null;
  }

  // Query by email since session.user.id may not match MongoDB ObjectId format
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });



  return user?.role === "admin" ? session.user : null;
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const adminUser = await getAdminUser();



  if (!adminUser) {

    redirect("/not-admin");
  }



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
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

