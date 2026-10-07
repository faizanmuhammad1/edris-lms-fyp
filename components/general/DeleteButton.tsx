"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
    id: string;
    deleteAction: (id: string) => Promise<{ status?: string; success?: boolean; message?: string; error?: string }>;
    variant?: "ghost" | "outline" | "destructive" | "default";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
}

export function DeleteButton({ id, deleteAction, variant = "ghost", size = "icon", className }: DeleteButtonProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this?")) {
            startTransition(async () => {
                const result = await deleteAction(id);
                if (result.status === "success" || result.success) {
                    toast.success(result.message || "Deleted successfully");
                    router.refresh();
                } else {
                    toast.error(result.error || result.message || "Failed to delete");
                }
            });
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleDelete}
            disabled={isPending}
            className={className}
        >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-destructive" />}
        </Button>
    );
}
