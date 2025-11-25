import { Suspense } from "react";
import { getTeacherApplications } from "@/app/data/admin/get-teacher-applications";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { TeacherApplicationCard } from "./_components/TeacherApplicationCard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Clock, CheckCircle2, XCircle } from "lucide-react";

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

    const stats = {
        total: applications.length,
        pending: applications.filter((a) => a.teacherStatus === "Pending").length,
        approved: applications.filter((a) => a.teacherStatus === "Approved").length,
        rejected: applications.filter((a) => a.teacherStatus === "Rejected").length,
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                                <p className="text-2xl font-bold mt-1">{stats.total}</p>
                            </div>
                            <div className="bg-primary/10 p-3 rounded-full">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold mt-1">{stats.pending}</p>
                            </div>
                            <div className="bg-yellow-500/10 p-3 rounded-full">
                                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                                <p className="text-2xl font-bold mt-1">{stats.approved}</p>
                            </div>
                            <div className="bg-green-500/10 p-3 rounded-full">
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                                <p className="text-2xl font-bold mt-1">{stats.rejected}</p>
                            </div>
                            <div className="bg-red-500/10 p-3 rounded-full">
                                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Applications List */}
            {applications.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                        <p className="text-muted-foreground">
                            Teacher applications will appear here once users apply.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {applications.map((application) => (
                        <TeacherApplicationCard
                            key={application.id}
                            application={application}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <Skeleton className="h-16 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <Skeleton className="h-40 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
