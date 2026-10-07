import { auth } from "@/lib/auth";
import { LoginForm } from "./_components/LoginForm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { safeCallbackPath } from "@/lib/safe-redirect";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in or create your Edris LMS account with a one-time email code or Google.",
  alternates: { canonical: "/login" },
};

export default async function LoginPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    const searchParams = await props.searchParams;
    const callbackURL = safeCallbackPath(searchParams?.callbackURL);

    if (callbackURL) {
      return redirect(callbackURL);
    }

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

