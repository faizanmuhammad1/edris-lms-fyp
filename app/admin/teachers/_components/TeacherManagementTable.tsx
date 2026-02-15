"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { IconDotsVertical, IconBan, IconUserCheck, IconCircleCheck, IconCircleX } from "@tabler/icons-react";
import { approveTeacher, rejectTeacher, approveTeacherAgain } from "@/app/actions/admin/approve-teacher";
import { banUser, unbanUser } from "@/app/admin/users/actions";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { TeacherApplication } from "@/app/data/admin/get-teacher-applications";

export function TeacherManagementTable({ teachers }: { teachers: TeacherApplication[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectTarget, setRejectTarget] = useState<TeacherApplication | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const handleApprove = (teacher: TeacherApplication) => {
        startTransition(async () => {
            const result = await approveTeacher(teacher.id);
            if (result.success) {
                toast.success(result.message);
                router.refresh();
            } else {
                toast.error(result.error);
            }
        });
    };

    const openRejectDialog = (teacher: TeacherApplication) => {
        setRejectTarget(teacher);
        setRejectionReason("");
        setRejectDialogOpen(true);
    };

    const handleReject = () => {
        if (!rejectTarget || !rejectionReason.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }
        startTransition(async () => {
            const result = await rejectTeacher(rejectTarget.id, rejectionReason.trim());
            if (result.success) {
                toast.success(result.message);
                setRejectDialogOpen(false);
                setRejectTarget(null);
                setRejectionReason("");
                router.refresh();
            } else {
                toast.error(result.error);
            }
        });
    };

    const handleApproveAgain = (teacher: TeacherApplication) => {
        startTransition(async () => {
            const result = await approveTeacherAgain(teacher.id);
            if (result.success) {
                toast.success(result.message);
                router.refresh();
            } else {
                toast.error(result.error);
            }
        });
    };

    const handleBan = (teacher: TeacherApplication) => {
        startTransition(async () => {
            await banUser(teacher.id, "Banned by admin");
            toast.success(`${teacher.name} has been banned`);
            router.refresh();
        });
    };

    const handleUnban = (teacher: TeacherApplication) => {
        startTransition(async () => {
            await unbanUser(teacher.id);
            toast.success(`${teacher.name} has been unbanned. Access restored.`);
            router.refresh();
        });
    };

    const getStatusBadge = (teacher: TeacherApplication) => {
        if (teacher.banned) {
            return (
                <Badge variant="destructive" className="whitespace-nowrap">
                    Banned
                </Badge>
            );
        }
        switch (teacher.teacherStatus) {
            case "Pending":
                return (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20 whitespace-nowrap">
                        Pending
                    </Badge>
                );
            case "Approved":
                return (
                    <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 whitespace-nowrap">
                        Approved
                    </Badge>
                );
            case "Rejected":
                return (
                    <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 whitespace-nowrap">
                        Rejected
                    </Badge>
                );
            default:
                return <Badge variant="secondary">—</Badge>;
        }
    };

    const getInitials = (name: string) =>
        name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

    return (
        <>
            <div className="rounded-lg border border-border/80 bg-white shadow-sm dark:bg-zinc-950/80 dark:border-zinc-800 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50 dark:bg-zinc-900/50">
                            <TableHead className="px-5 py-4">Teacher</TableHead>
                            <TableHead className="px-5 py-4">Status</TableHead>
                            <TableHead className="px-5 py-4">Applied</TableHead>
                            <TableHead className="px-5 py-4">Courses</TableHead>
                            <TableHead className="max-w-[220px] px-5 py-4">Rejection / Ban reason</TableHead>
                            <TableHead className="w-[80px] px-5 py-4">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teachers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-16 px-5">
                                    No teachers in this category
                                </TableCell>
                            </TableRow>
                        ) : (
                            teachers.map((teacher) => (
                                <TableRow key={teacher.id}>
                                    <TableCell className="px-5 py-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <Avatar className="h-10 w-10 shrink-0">
                                                <AvatarImage src={teacher.image || undefined} alt={teacher.name} />
                                                <AvatarFallback className="text-xs">{getInitials(teacher.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 space-y-0.5">
                                                <p className="font-medium truncate">{teacher.name}</p>
                                                <p className="text-sm text-muted-foreground truncate">{teacher.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-5 py-4">{getStatusBadge(teacher)}</TableCell>
                                    <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                                        {teacher.teacherApplicationDate
                                            ? formatDistanceToNow(new Date(teacher.teacherApplicationDate), { addSuffix: true })
                                            : "—"}
                                    </TableCell>
                                    <TableCell className="px-5 py-4">{teacher._count.courses}</TableCell>
                                    <TableCell className="max-w-[220px] px-5 py-4 truncate text-sm text-muted-foreground">
                                        {teacher.banned && teacher.banReason
                                            ? teacher.banReason
                                            : teacher.teacherStatus === "Rejected" && teacher.teacherRejectionReason
                                                ? teacher.teacherRejectionReason
                                                : "—"}
                                    </TableCell>
                                    <TableCell className="px-5 py-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={isPending}>
                                                    <IconDotsVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {teacher.teacherStatus === "Pending" && !teacher.banned && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => handleApprove(teacher)}>
                                                            <IconCircleCheck className="mr-2 h-4 w-4" />
                                                            Approve
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => openRejectDialog(teacher)}
                                                        >
                                                            <IconCircleX className="mr-2 h-4 w-4" />
                                                            Reject
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                {teacher.teacherStatus === "Approved" && !teacher.banned && (
                                                    <DropdownMenuItem onClick={() => handleBan(teacher)}>
                                                        <IconBan className="mr-2 h-4 w-4" />
                                                        Ban
                                                    </DropdownMenuItem>
                                                )}
                                                {teacher.teacherStatus === "Rejected" && !teacher.banned && (
                                                    <DropdownMenuItem onClick={() => handleApproveAgain(teacher)}>
                                                        <IconCircleCheck className="mr-2 h-4 w-4" />
                                                        Approve again
                                                    </DropdownMenuItem>
                                                )}
                                                {teacher.banned && (
                                                    <DropdownMenuItem onClick={() => handleUnban(teacher)}>
                                                        <IconUserCheck className="mr-2 h-4 w-4" />
                                                        Unban and restore access
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Teacher Application</DialogTitle>
                        <DialogDescription>
                            {rejectTarget
                                ? `Provide a reason for rejecting ${rejectTarget.name}'s application. This will be shown to the applicant.`
                                : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Rejection Reason</Label>
                            <Textarea
                                id="reason"
                                placeholder="e.g., Insufficient teaching experience, incomplete profile..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRejectDialogOpen(false);
                                setRejectTarget(null);
                            }}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReject} disabled={isPending || !rejectionReason.trim()}>
                            {isPending ? "Rejecting..." : "Reject Application"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
