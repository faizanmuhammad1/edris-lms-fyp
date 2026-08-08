"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { UserCheck } from "lucide-react";
import { toast } from "sonner";
import { unbanEnrollment } from "../actions";

type Props = {
    enrollmentId: string;
    studentName: string;
    courseTitle: string;
};

export function UnbanButton({ enrollmentId, studentName, courseTitle }: Props) {
    const [isPending, startTransition] = useTransition();

    const handleUnban = () => {
        startTransition(async () => {
            const result = await unbanEnrollment(enrollmentId);
            if (result.ok) {
                toast.success(`${studentName} has been unbanned and can access ${courseTitle} again.`);
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleUnban}
            disabled={isPending}
            className="gap-2"
        >
            <UserCheck className="h-4 w-4" />
            Unban
        </Button>
    );
}
