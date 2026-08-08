"use client";

import { useState, useMemo } from "react";
import type { TeacherApplication } from "@/app/data/admin/get-teacher-applications";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeacherManagementTable } from "./TeacherManagementTable";
import { IconUsers, IconClock, IconCircleCheck, IconCircleX, IconBan, IconUserOff } from "@tabler/icons-react";

type TabValue = "all" | "pending" | "approved" | "rejected" | "banned" | "removed";

function filterByTab(applications: TeacherApplication[], tab: TabValue): TeacherApplication[] {
    switch (tab) {
        case "all":
            return applications;
        case "pending":
            return applications.filter((a) => a.teacherStatus === "Pending" && !a.banned);
        case "approved":
            return applications.filter((a) => a.teacherStatus === "Approved" && !a.banned);
        case "rejected":
            return applications.filter((a) => a.teacherStatus === "Rejected");
        case "banned":
            return applications.filter((a) => a.banned === true);
        case "removed":
            return applications.filter((a) => a.teacherStatus === "Rejected" || a.banned === true);
        default:
            return applications;
    }
}

export function TeacherManagementView({ applications }: { applications: TeacherApplication[] }) {
    const [activeTab, setActiveTab] = useState<TabValue>("all");

    const stats = useMemo(() => {
        const approved = applications.filter((a) => a.teacherStatus === "Approved" && !a.banned).length;
        const banned = applications.filter((a) => a.banned === true).length;
        const removed = applications.filter((a) => a.teacherStatus === "Rejected" || a.banned === true).length;
        return {
            total: applications.length,
            pending: applications.filter((a) => a.teacherStatus === "Pending" && !a.banned).length,
            approved,
            rejected: applications.filter((a) => a.teacherStatus === "Rejected").length,
            banned,
            removed,
        };
    }, [applications]);

    return (
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
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
                                <p className="text-xs font-medium text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold mt-1">{stats.pending}</p>
                            </div>
                            <div className="bg-yellow-500/10 p-2.5 rounded-full">
                                <IconClock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Approved</p>
                                <p className="text-2xl font-bold mt-1">{stats.approved}</p>
                            </div>
                            <div className="bg-green-500/10 p-2.5 rounded-full">
                                <IconCircleCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Rejected</p>
                                <p className="text-2xl font-bold mt-1">{stats.rejected}</p>
                            </div>
                            <div className="bg-red-500/10 p-2.5 rounded-full">
                                <IconCircleX className="h-4 w-4 text-red-600 dark:text-red-400" />
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
                            <div className="bg-orange-500/10 p-2.5 rounded-full">
                                <IconBan className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Removed</p>
                                <p className="text-2xl font-bold mt-1">{stats.removed}</p>
                            </div>
                            <div className="bg-slate-500/10 p-2.5 rounded-full">
                                <IconUserOff className="h-4 w-4 text-slate-600 dark:text-slate-400" />
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
                    <TabsTrigger value="pending" className="px-4 py-2.5 text-sm data-[state=active]:shadow-sm">
                        Pending
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="px-4 py-2.5 text-sm data-[state=active]:shadow-sm">
                        Approved
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="px-4 py-2.5 text-sm data-[state=active]:shadow-sm">
                        Rejected
                    </TabsTrigger>
                    <TabsTrigger value="banned" className="px-4 py-2.5 text-sm data-[state=active]:shadow-sm">
                        Banned
                    </TabsTrigger>
                    <TabsTrigger value="removed" className="px-4 py-2.5 text-sm data-[state=active]:shadow-sm">
                        Removed
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                    <TeacherManagementTable teachers={filterByTab(applications, "all")} />
                </TabsContent>
                <TabsContent value="pending" className="mt-6">
                    <TeacherManagementTable teachers={filterByTab(applications, "pending")} />
                </TabsContent>
                <TabsContent value="approved" className="mt-6">
                    <TeacherManagementTable teachers={filterByTab(applications, "approved")} />
                </TabsContent>
                <TabsContent value="rejected" className="mt-6">
                    <TeacherManagementTable teachers={filterByTab(applications, "rejected")} />
                </TabsContent>
                <TabsContent value="banned" className="mt-6">
                    <TeacherManagementTable teachers={filterByTab(applications, "banned")} />
                </TabsContent>
                <TabsContent value="removed" className="mt-6">
                    <p className="text-sm text-muted-foreground mb-4">Rejected or banned teachers.</p>
                    <TeacherManagementTable teachers={filterByTab(applications, "removed")} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
