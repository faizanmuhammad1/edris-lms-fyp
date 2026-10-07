import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { UserManagementView } from "./_components/UserManagementView";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/app/data/admin/require-admin";

export const metadata = {
    title: "User Management | Admin",
    description: "Manage all users on the platform",
};

async function getUsers() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            banned: true,
            banReason: true,
            createdAt: true,
            _count: {
                select: {
                    enrollment: true,
                    courses: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    return users;
}

export default async function UsersPage() {
    await requireAdmin();
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground mt-2">
                    View and manage all users on the platform. Ban, unban, or delete users.
                </p>
            </div>

            <Suspense fallback={<LoadingSkeleton />}>
                <UserManagementList />
            </Suspense>
        </div>
    );
}

async function UserManagementList() {
    const users = await getUsers();
    return <UserManagementView users={users} />;
}

function LoadingSkeleton() {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-5">
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
