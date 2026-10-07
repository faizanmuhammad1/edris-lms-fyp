import { PageHeader } from "@/components/general/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { TeacherSupportTickets } from "./_components/TeacherSupportTickets";

export const metadata: Metadata = { title: "Support" };

export default function TeacherSupportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Help students in your courses and get help from the platform team."
        actions={
          <Link href="/teacher/support/new" className={buttonVariants({ className: "h-10" })}>
            <Plus aria-hidden="true" />
            New ticket
          </Link>
        }
      />
      <TeacherSupportTickets />
    </div>
  );
}
