import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifyRequestForm } from "./_components/VerifyRequestForm";

export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false, follow: false },
};

export default function VerifyRequestRoute() {
  return (
    <Suspense
      fallback={
        <Card className="w-full" aria-busy="true">
          <CardHeader className="items-center space-y-2 text-center">
            <Skeleton className="mx-auto h-7 w-48" />
            <Skeleton className="mx-auto h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="mx-auto h-11 w-72 max-w-full" />
            <Skeleton className="h-11 w-full" />
          </CardContent>
        </Card>
      }
    >
      <VerifyRequestForm />
    </Suspense>
  );
}
