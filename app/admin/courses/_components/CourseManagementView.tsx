"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseManagementTable } from "./CourseManagementTable";
import { IconBook, IconFilePencil, IconWorld, IconArchive } from "@tabler/icons-react";

export type CourseForManagement = {
    id: string;
    title: string;
    slug: string;
    status: string;
    price: number;
    createdAt: Date;
    user: { id: string; name: string; email: string };
    _count: { enrollment: number; chapter: number };
};

type TabValue = "all" | "draft" | "published" | "archived";

function filterByTab(courses: CourseForManagement[], tab: TabValue): CourseForManagement[] {
    switch (tab) {
        case "all":
            return courses;
        case "draft":
            return courses.filter((c) => c.status === "Draft");
        case "published":
            return courses.filter((c) => c.status === "Published");
        case "archived":
            return courses.filter((c) => c.status === "Archived");
        default:
            return courses;
    }
}

export function CourseManagementView({ courses }: { courses: CourseForManagement[] }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabValue>("all");

    const stats = useMemo(() => ({
        total: courses.length,
        draft: courses.filter((c) => c.status === "Draft").length,
        published: courses.filter((c) => c.status === "Published").length,
        archived: courses.filter((c) => c.status === "Archived").length,
    }), [courses]);

    return (
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Total</p>
                                <p className="text-2xl font-bold mt-1">{stats.total}</p>
                            </div>
                            <div className="bg-primary/10 p-2.5 rounded-full">
                                <IconBook className="h-4 w-4 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Draft</p>
                                <p className="text-2xl font-bold mt-1">{stats.draft}</p>
                            </div>
                            <div className="bg-slate-500/10 p-2.5 rounded-full">
                                <IconFilePencil className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Published</p>
                                <p className="text-2xl font-bold mt-1">{stats.published}</p>
                            </div>
                            <div className="bg-green-500/10 p-2.5 rounded-full">
                                <IconWorld className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Archived</p>
                                <p className="text-2xl font-bold mt-1">{stats.archived}</p>
                            </div>
                            <div className="bg-orange-500/10 p-2.5 rounded-full">
                                <IconArchive className="h-4 w-4 text-orange-600 dark:text-orange-400" />
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
                    <TabsTrigger value="draft" className="px-4 py-2.5 text-sm data-[state=active]:shadow-sm">
                        Draft
                    </TabsTrigger>
                    <TabsTrigger value="published" className="px-4 py-2.5 text-sm data-[state=active]:shadow-sm">
                        Published
                    </TabsTrigger>
                    <TabsTrigger value="archived" className="px-4 py-2.5 text-sm data-[state=active]:shadow-sm">
                        Archived
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                    <CourseManagementTable courses={filterByTab(courses, "all")} onAction={() => router.refresh()} />
                </TabsContent>
                <TabsContent value="draft" className="mt-6">
                    <CourseManagementTable courses={filterByTab(courses, "draft")} onAction={() => router.refresh()} />
                </TabsContent>
                <TabsContent value="published" className="mt-6">
                    <CourseManagementTable courses={filterByTab(courses, "published")} onAction={() => router.refresh()} />
                </TabsContent>
                <TabsContent value="archived" className="mt-6">
                    <CourseManagementTable courses={filterByTab(courses, "archived")} onAction={() => router.refresh()} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
