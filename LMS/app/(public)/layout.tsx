import { ReactNode } from "react";
import { Navbar } from "./_components/Navbar";
import { Footer } from "./_components/Footer";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

async function redirectByRole() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
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
  }
}

export default async function LayoutPublic({ children }: { children: ReactNode }) {
  await redirectByRole();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

