"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
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
import { Mail, MoreHorizontal, Ban, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { banEnrollment, removeEnrollment } from "../actions";

type Props = {
    enrollmentId: string;
    studentName: string;
    courseTitle: string;
};

export function EnrollmentActions({ enrollmentId, studentName, courseTitle }: Props) {
    const [isPending, startTransition] = useTransition();
    const [banDialogOpen, setBanDialogOpen] = useState(false);
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

    const handleBan = () => {
        startTransition(async () => {
            const result = await banEnrollment(enrollmentId);
            if (result.ok) {
                toast.success(`${studentName} has been banned from ${courseTitle}. Their access is revoked.`);
                setBanDialogOpen(false);
            } else {
                toast.error(result.error);
            }
        });
    };

    const handleRemove = () => {
        startTransition(async () => {
            const result = await removeEnrollment(enrollmentId);
            if (result.ok) {
                toast.success(`${studentName} has been removed from ${courseTitle}. All related data was deleted.`);
                setRemoveDialogOpen(false);
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <>
            <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" title="Contact Student">
                    <Mail className="h-4 w-4" />
                    <span className="sr-only">Contact</span>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isPending} title="Actions">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() => setBanDialogOpen(true)}
                            className="text-amber-600 focus:text-amber-600"
                        >
                            <Ban className="mr-2 h-4 w-4" />
                            Ban access
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setRemoveDialogOpen(true)}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove & delete all data
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ban access</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ban <strong>{studentName}</strong> from <strong>{courseTitle}</strong>? They will lose
                            access to the course immediately. No progress or data will be deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBan} disabled={isPending} className="bg-amber-600 hover:bg-amber-700">
                            Ban access
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove student and delete all data</AlertDialogTitle>
                        <AlertDialogDescription>
                            Permanently remove <strong>{studentName}</strong> from <strong>{courseTitle}</strong>?
                            This will delete their enrollment, progress, quiz attempts, assignment submissions, and
                            certificate for this course. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemove}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Remove & delete all
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
