"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TeacherApplication } from "@/app/data/admin/get-teacher-applications";
import { approveTeacher, rejectTeacher } from "@/app/actions/admin/approve-teacher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { CheckCircle2, XCircle, Clock, BookOpen, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface TeacherApplicationCardProps {
    application: TeacherApplication;
}

export function TeacherApplicationCard({ application }: TeacherApplicationCardProps) {
    const router = useRouter();
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const handleApprove = async () => {
        setIsProcessing(true);
        try {
            const result = await approveTeacher(application.id);
            if (result.success) {
                toast.success(result.message);
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to approve teacher");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        setIsProcessing(true);
        try {
            const result = await rejectTeacher(application.id, rejectionReason);
            if (result.success) {
                toast.success(result.message);
                setIsRejectDialogOpen(false);
                setRejectionReason("");
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to reject teacher");
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusBadge = () => {
        switch (application.teacherStatus) {
            case "Pending":
                return (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                    </Badge>
                );
            case "Approved":
                return (
                    <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Approved
                    </Badge>
                );
            case "Rejected":
                return (
                    <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejected
                    </Badge>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Card className="hover:shadow-lg transition-all duration-300 border-border/50">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={application.image || undefined} alt={application.name} />
                                <AvatarFallback>{application.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-lg">{application.name}</CardTitle>
                                <CardDescription className="flex items-center gap-1 mt-1">
                                    <Mail className="w-3 h-3" />
                                    {application.email}
                                </CardDescription>
                            </div>
                        </div>
                        {getStatusBadge()}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>
                                Applied {application.teacherApplicationDate
                                    ? formatDistanceToNow(new Date(application.teacherApplicationDate), { addSuffix: true })
                                    : "Unknown"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <BookOpen className="w-4 h-4" />
                            <span>{application._count.courses} courses created</span>
                        </div>
                    </div>

                    {application.teacherStatus === "Rejected" && application.teacherRejectionReason && (
                        <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                            <p className="text-sm font-medium text-destructive mb-1">Rejection Reason:</p>
                            <p className="text-sm text-muted-foreground">{application.teacherRejectionReason}</p>
                        </div>
                    )}

                    {application.teacherStatus === "Pending" && (
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={handleApprove}
                                disabled={isProcessing}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Approve
                            </Button>
                            <Button
                                onClick={() => setIsRejectDialogOpen(true)}
                                disabled={isProcessing}
                                variant="destructive"
                                className="flex-1"
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Teacher Application</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting {application.name}'s application. This will be shown to the applicant.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Rejection Reason</Label>
                            <Textarea
                                id="reason"
                                placeholder="e.g., Insufficient teaching experience, incomplete profile, etc."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={isProcessing}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
                            {isProcessing ? "Rejecting..." : "Reject Application"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
