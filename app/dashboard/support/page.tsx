import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/general/PageHeader";
import { Button } from "@/components/ui/button";
import { PageContainer } from "../_components/PageContainer";
import { StudentTicketList } from "./_components/StudentTicketList";

export const metadata: Metadata = {
  title: "Support & Help",
};

export default function StudentSupportPage() {
  return (
    <PageContainer width="medium">
      <PageHeader
        title="Support & help"
        description="Get help with your courses, account or any platform issue."
        actions={
          <Button asChild size="lg">
            <Link href="/dashboard/support/new">
              <PlusCircle aria-hidden="true" />
              New ticket
            </Link>
          </Button>
        }
      />
      <StudentTicketList />
    </PageContainer>
  );
}
