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
  // A template here keeps the site suffix on every student page title.
  title: {
    default: "My Learning",
    template: "%s | Edris LMS",
  },
  description: "Access your enrolled courses and track your progress",
  // Private area: keep out of search engines.
  robots: { index: false, follow: false },
};

async function requireStudentAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  // Admins use their own portal. Teachers may preview student pages (e.g. the forum);
  // the dashboard home page redirects them to /teacher.
  if (user?.role === "admin") {
    redirect("/admin");
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
      <SidebarInset className="min-w-0">
        <SiteHeader />
        {/* overflow-x-clip (not hidden) so sticky children keep working. */}
        <div className="flex min-w-0 flex-1 flex-col overflow-x-clip">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
