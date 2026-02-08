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
import { deleteCourse, archiveCourse, publishCourse, unpublishCourse } from "../actions";
import { toast } from "sonner";
import { format } from "date-fns";

interface Course {
    id: string;
    title: string;
    slug: string;
    status: string;
    price: number;
    createdAt: Date;
    user: {
        id: string;
        name: string;
        email: string;
    };
    _count: {
        enrollment: number;
        chapter: number;
    };
}

export function CourseManagementTable({ courses }: { courses: Course[] }) {
    const [isPending, startTransition] = useTransition();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    const handleDelete = () => {
        if (!selectedCourse) return;
        startTransition(async () => {
            await deleteCourse(selectedCourse.id);
            toast.success(`"${selectedCourse.title}" has been deleted`);
            setDeleteDialogOpen(false);
            setSelectedCourse(null);
        });
    };

    const handleArchive = (course: Course) => {
        startTransition(async () => {
            await archiveCourse(course.id);
            toast.success(`"${course.title}" has been archived`);
        });
    };

    const handlePublish = (course: Course) => {
        startTransition(async () => {
            await publishCourse(course.id);
            toast.success(`"${course.title}" is now published`);
        });
    };

    const handleUnpublish = (course: Course) => {
        startTransition(async () => {
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
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Course</TableHead>
                            <TableHead>Teacher</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Enrollments</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-[70px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {courses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                    No courses found
                                </TableCell>
                            </TableRow>
                        ) : (
                            courses.map((course) => (
                                <TableRow key={course.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{course.title}</p>
                                            <p className="text-sm text-muted-foreground">{course._count.chapter} chapters</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="text-sm">{course.user.name}</p>
                                            <p className="text-xs text-muted-foreground">{course.user.email}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(course.status)}</TableCell>
                                    <TableCell>${(course.price / 100).toFixed(2)}</TableCell>
                                    <TableCell>{course._count.enrollment}</TableCell>
                                    <TableCell>{format(new Date(course.createdAt), "MMM d, yyyy")}</TableCell>
                                    <TableCell>
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
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
