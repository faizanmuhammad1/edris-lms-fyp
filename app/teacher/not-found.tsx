import { buttonVariants } from "@/components/ui/button";
import { BookOpen, FileQuestion, LayoutDashboard } from "lucide-react";
import Link from "next/link";

/** Shown inside the teacher layout when a course, lesson or other teacher resource doesn't exist or isn't yours. */
export default function TeacherNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <div className="max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
          <FileQuestion className="size-7 text-primary" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
          <p className="text-muted-foreground">
            This page doesn&apos;t exist, or it belongs to a course you don&apos;t manage.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/teacher/courses" className={buttonVariants({ className: "h-10" })}>
            <BookOpen aria-hidden="true" />
            Your courses
          </Link>
          <Link href="/teacher" className={buttonVariants({ variant: "outline", className: "h-10" })}>
            <LayoutDashboard aria-hidden="true" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
