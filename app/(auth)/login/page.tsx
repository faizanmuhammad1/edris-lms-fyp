import { auth } from "@/lib/auth";
import { LoginForm } from "./_components/LoginForm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    // Check user role and redirect accordingly
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, teacherStatus: true },
    });

    if (user?.role === "admin") {
      return redirect("/admin");
    }

    if (user?.role === "teacher" || user?.teacherStatus === "Approved") {
      return redirect("/teacher");
    }

    return redirect("/dashboard");
  }
  return <LoginForm />;
}

