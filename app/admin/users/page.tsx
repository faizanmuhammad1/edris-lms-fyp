import { prisma } from "@/lib/db";
import { UserManagementTable } from "./_components/UserManagementTable";

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
    const users = await getUsers();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground">
                    View and manage all users on the platform. Ban, unban, or delete users.
                </p>
            </div>

            <UserManagementTable users={users} />
        </div>
    );
}
