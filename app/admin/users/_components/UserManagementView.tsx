"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagementTable } from "./UserManagementTable";
import { IconUsers, IconShield, IconSchool, IconUser, IconBan } from "@tabler/icons-react";

export type UserForManagement = {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string | null;
    banned: boolean | null;
    banReason: string | null;
    createdAt: Date;
    _count: { enrollment: number; courses: number };
};

type TabValue = "all" | "admin" | "teacher" | "student" | "banned";

function filterByTab(users: UserForManagement[], tab: TabValue): UserForManagement[] {
    switch (tab) {
        case "all":
            return users;
        case "admin":
            return users.filter((u) => u.role === "admin");
        case "teacher":
            return users.filter((u) => u.role === "teacher" && !u.banned);
        case "student":
            return users.filter((u) => u.role !== "admin" && u.role !== "teacher" && !u.banned);
        case "banned":
            return users.filter((u) => u.banned === true);
        default:
            return users;
    }
}

export function UserManagementView({ users }: { users: UserForManagement[] }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabValue>("all");

    const stats = useMemo(() => {
        const banned = users.filter((u) => u.banned === true).length;
        return {
            total: users.length,
            admin: users.filter((u) => u.role === "admin").length,
            teacher: users.filter((u) => u.role === "teacher" && !u.banned).length,
            student: users.filter((u) => u.role !== "admin" && u.role !== "teacher" && !u.banned).length,
            banned,
        };
    }, [users]);

    return (
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Total</p>
                                <p className="text-2xl font-bold mt-1">{stats.total}</p>
                            </div>
                            <div className="bg-primary/10 p-2.5 rounded-full">
                                <IconUsers className="h-4 w-4 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Admin</p>
                                <p className="text-2xl font-bold mt-1">{stats.admin}</p>
                            </div>
                            <div className="bg-purple-500/10 p-2.5 rounded-full">
                                <IconShield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Teacher</p>
                                <p className="text-2xl font-bold mt-1">{stats.teacher}</p>
                            </div>
                            <div className="bg-blue-500/10 p-2.5 rounded-full">
                                <IconSchool className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Student</p>
                                <p className="text-2xl font-bold mt-1">{stats.student}</p>
                            </div>
                            <div className="bg-slate-500/10 p-2.5 rounded-full">
                                <IconUser className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Banned</p>
                                <p className="text-2xl font-bold mt-1">{stats.banned}</p>
                            </div>
                            <div className="bg-red-500/10 p-2.5 rounded-full">
                                <IconBan className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs + Table */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="space-y-0">
                <TabsList className="flex flex-wrap h-auto gap-2 p-1.5 bg-muted/60 w-fit">
                    <TabsTrigger value="all" className="px-4 py-2.5 text-sm data-[state=active]:shadow-sm">
                        All
                    </TabsTrigger>
                    <TabsTrigger value="admin" className="px-4 py-2.5 text-sm data-[state=active]:shadow-sm">
                        Admin
                    </TabsTrigger>
                    <TabsTrigger value="teacher" className="px-4 py-2.5 text-sm data-[state=active]:shadow-sm">
                        Teacher
                    </TabsTrigger>
                    <TabsTrigger value="student" className="px-4 py-2.5 text-sm data-[state=active]:shadow-sm">
                        Student
                    </TabsTrigger>
                    <TabsTrigger value="banned" className="px-4 py-2.5 text-sm data-[state=active]:shadow-sm">
                        Banned
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                    <UserManagementTable users={filterByTab(users, "all")} onAction={() => router.refresh()} />
                </TabsContent>
                <TabsContent value="admin" className="mt-6">
                    <UserManagementTable users={filterByTab(users, "admin")} onAction={() => router.refresh()} />
                </TabsContent>
                <TabsContent value="teacher" className="mt-6">
                    <UserManagementTable users={filterByTab(users, "teacher")} onAction={() => router.refresh()} />
                </TabsContent>
                <TabsContent value="student" className="mt-6">
                    <UserManagementTable users={filterByTab(users, "student")} onAction={() => router.refresh()} />
                </TabsContent>
                <TabsContent value="banned" className="mt-6">
                    <UserManagementTable users={filterByTab(users, "banned")} onAction={() => router.refresh()} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
