"use client";

import { useState } from "react";
import { Ban, Mail, MoreHorizontal, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import type { ApiResponse } from "@/lib/types";
import { banEnrollment, removeEnrollment, unbanEnrollment } from "../actions";
import type { EnrollmentRowStatus } from "./types";

type Props = {
    enrollmentId: string;
    status: EnrollmentRowStatus;
    studentName: string;
    studentEmail: string;
    courseTitle: string;
};

type PendingAction = "ban" | "unban" | "remove" | null;

/** Row actions for an enrollment: email, ban / restore access, remove with all course data. */
export function EnrollmentActions({ enrollmentId, status, studentName, studentEmail, courseTitle }: Props) {
    const [dialog, setDialog] = useState<PendingAction>(null);

    async function run(action: (id: string) => Promise<ApiResponse>) {
        try {
            const result = await action(enrollmentId);
            if (result.status === "error") {
                toast.error(result.message);
                return false;
            }
            toast.success(result.message);
            // The action revalidates /teacher/students, so the list updates with its response.
            return true;
        } catch {
            toast.error("Something went wrong. Please try again.");
            return false;
        }
    }

    const onOpenChange = (open: boolean) => {
        if (!open) setDialog(null);
    };

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-10" aria-label={`Actions for ${studentName}`}>
                        <MoreHorizontal aria-hidden="true" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="truncate" title={studentName}>
                        {studentName}
                    </DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                        <a href={`mailto:${studentEmail}`}>
                            <Mail aria-hidden="true" />
                            Email student
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {status === "Active" ? (
                        <DropdownMenuItem onSelect={() => setDialog("ban")}>
                            <Ban aria-hidden="true" />
                            Ban access
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onSelect={() => setDialog("unban")}>
                            <UserCheck aria-hidden="true" />
                            Restore access
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem variant="destructive" onSelect={() => setDialog("remove")}>
                        <Trash2 aria-hidden="true" />
                        Remove enrollment
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmDialog
                open={dialog === "ban"}
                onOpenChange={onOpenChange}
                title={`Ban ${studentName}?`}
                description={
                    <>
                        <strong className="text-foreground">{studentName}</strong> will immediately lose access to{" "}
                        <strong className="text-foreground">{courseTitle}</strong>. Their progress, quiz attempts and
                        submissions are kept, and you can restore access at any time.
                    </>
                }
                confirmLabel="Ban access"
                destructive
                onConfirm={() => run(banEnrollment)}
            />

            <ConfirmDialog
                open={dialog === "unban"}
                onOpenChange={onOpenChange}
                title={`Restore access for ${studentName}?`}
                description={
                    <>
                        <strong className="text-foreground">{studentName}</strong> will be able to open{" "}
                        <strong className="text-foreground">{courseTitle}</strong> again, with their previous progress
                        intact.
                    </>
                }
                confirmLabel="Restore access"
                onConfirm={() => run(unbanEnrollment)}
            />

            <ConfirmDialog
                open={dialog === "remove"}
                onOpenChange={onOpenChange}
                title={`Remove ${studentName} from this course?`}
                description={
                    <>
                        This revokes access to <strong className="text-foreground">{courseTitle}</strong> and
                        permanently deletes {studentName}&apos;s enrollment, lesson progress, quiz attempts, assignment
                        submissions and certificate for this course. This can&apos;t be undone.
                    </>
                }
                confirmLabel="Remove and delete data"
                destructive
                onConfirm={() => run(removeEnrollment)}
            />
        </>
    );
}
