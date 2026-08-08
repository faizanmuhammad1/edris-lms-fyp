import { SiteHeader } from "@/components/sidebar/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";
import { AppSidebar } from "./_components/DashboardAppSidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "My Learning",
  description: "Access your enrolled courses and track your progress",
};

async function requireStudentAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Check if user is admin or teacher - redirect them to their portal
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, teacherStatus: true },
  });

  if (user?.role === "admin") {
    redirect("/admin");
  }

  if (user?.role === "teacher" || user?.teacherStatus === "Approved") {
    redirect("/teacher");
  }

  return session;
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireStudentAuth();

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

