"use client";

import { useState, useTransition } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { IconDotsVertical, IconTrash, IconArchive, IconWorld, IconWorldOff } from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import { deleteCourse, archiveCourse, publishCourse, unpublishCourse } from "../actions";
import { toast } from "sonner";
import { format } from "date-fns";
import type { CourseForManagement } from "./CourseManagementView";

export function CourseManagementTable({
    courses,
    onAction,
}: {
    courses: CourseForManagement[];
    onAction?: () => void;
}) {
    const [isPending, startTransition] = useTransition();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<CourseForManagement | null>(null);

    const runAction = (fn: () => Promise<void>) => {
        startTransition(async () => {
            await fn();
            onAction?.();
        });
    };

    const handleDelete = () => {
        if (!selectedCourse) return;
        runAction(async () => {
            await deleteCourse(selectedCourse.id);
            toast.success(`"${selectedCourse.title}" has been deleted`);
            setDeleteDialogOpen(false);
            setSelectedCourse(null);
        });
    };

    const handleArchive = (course: CourseForManagement) => {
        runAction(async () => {
            await archiveCourse(course.id);
            toast.success(`"${course.title}" has been archived`);
        });
    };

    const handlePublish = (course: CourseForManagement) => {
        runAction(async () => {
            await publishCourse(course.id);
            toast.success(`"${course.title}" is now published`);
        });
    };

    const handleUnpublish = (course: CourseForManagement) => {
        runAction(async () => {
            await unpublishCourse(course.id);
            toast.success(`"${course.title}" has been unpublished`);
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Published":
                return <Badge className="bg-green-600">Published</Badge>;
            case "Draft":
                return <Badge variant="secondary">Draft</Badge>;
            case "Archived":
                return <Badge variant="outline">Archived</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <>
            <div className="rounded-lg border border-border/80 bg-white shadow-sm dark:bg-zinc-950/80 dark:border-zinc-800 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50 dark:bg-zinc-900/50">
                            <TableHead className="px-5 py-4">Course</TableHead>
                            <TableHead className="px-5 py-4">Teacher</TableHead>
                            <TableHead className="px-5 py-4">Status</TableHead>
                            <TableHead className="px-5 py-4">Price</TableHead>
                            <TableHead className="px-5 py-4">Enrollments</TableHead>
                            <TableHead className="px-5 py-4">Created</TableHead>
                            <TableHead className="w-[80px] px-5 py-4">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {courses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-16 px-5">
                                    No courses in this category
                                </TableCell>
                            </TableRow>
                        ) : (
                            courses.map((course) => (
                                <TableRow key={course.id}>
                                    <TableCell className="px-5 py-4">
                                        <div className="min-w-0 space-y-0.5">
                                            <p className="font-medium truncate">{course.title}</p>
                                            <p className="text-sm text-muted-foreground">{course._count.chapter} chapters</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-5 py-4">
                                        <div className="min-w-0 space-y-0.5">
                                            <p className="text-sm truncate">{course.user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{course.user.email}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-5 py-4">{getStatusBadge(course.status)}</TableCell>
                                    <TableCell className="px-5 py-4">
                                        {course.price === 0
                                            ? "Free"
                                            : new Intl.NumberFormat("en-US", {
                                                style: "currency",
                                                currency: "USD",
                                            }).format(course.price)}
                                    </TableCell>
                                    <TableCell className="px-5 py-4">{course._count.enrollment}</TableCell>
                                    <TableCell className="px-5 py-4">{format(new Date(course.createdAt), "MMM d, yyyy")}</TableCell>
                                    <TableCell className="px-5 py-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={isPending}>
                                                    <IconDotsVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {course.status !== "Published" && (
                                                    <DropdownMenuItem onClick={() => handlePublish(course)}>
                                                        <IconWorld className="mr-2 h-4 w-4" />
                                                        Publish
                                                    </DropdownMenuItem>
                                                )}
                                                {course.status === "Published" && (
                                                    <DropdownMenuItem onClick={() => handleUnpublish(course)}>
                                                        <IconWorldOff className="mr-2 h-4 w-4" />
                                                        Unpublish
                                                    </DropdownMenuItem>
                                                )}
                                                {course.status !== "Archived" && (
                                                    <DropdownMenuItem onClick={() => handleArchive(course)}>
                                                        <IconArchive className="mr-2 h-4 w-4" />
                                                        Archive
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => {
                                                        setSelectedCourse(course);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <IconTrash className="mr-2 h-4 w-4" />
                                                    Delete Course
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Course</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{selectedCourse?.title}&quot;? This action cannot be undone.
                            All chapters, lessons, enrollments, and student progress will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
