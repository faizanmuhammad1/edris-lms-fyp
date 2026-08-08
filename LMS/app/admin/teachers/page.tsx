import { Suspense } from "react";
import { getTeacherApplications } from "@/app/data/admin/get-teacher-applications";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { TeacherManagementView } from "./_components/TeacherManagementView";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
    await requireAdmin();
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Teacher Applications</h1>
                <p className="text-muted-foreground mt-2">
                    Review and manage teacher applications for your platform.
                </p>
            </div>

            <Suspense fallback={<LoadingSkeleton />}>
                <TeacherApplicationsList />
            </Suspense>
        </div>
    );
}

async function TeacherApplicationsList() {
    const applications = await getTeacherApplications();

    return <TeacherManagementView applications={applications} />;
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4">
                            <Skeleton className="h-16 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardContent className="p-12">
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}
