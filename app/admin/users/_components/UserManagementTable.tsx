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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { IconDotsVertical, IconBan, IconUserCheck, IconTrash, IconShield } from "@tabler/icons-react";
import { banUser, unbanUser, deleteUser, updateUserRole, type UserActionResult } from "../actions";
import { toast } from "sonner";
import { format } from "date-fns";
import type { UserForManagement } from "./UserManagementView";

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function UserManagementTable({
    users,
    onAction,
}: {
    users: UserForManagement[];
    onAction?: () => void;
}) {
    const [isPending, startTransition] = useTransition();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserForManagement | null>(null);

    const runAction = (
        fn: () => Promise<UserActionResult>,
        successMessage: string,
        onSuccess?: () => void
    ) => {
        startTransition(async () => {
            const result = await fn();
            if (result.status === "error") {
                toast.error(result.message);
                return;
            }
            toast.success(successMessage);
            onSuccess?.();
            onAction?.();
        });
    };

    const handleBan = (user: UserForManagement) => {
        runAction(() => banUser(user.id, "Banned by admin"), `${user.name} has been banned`);
    };

    const handleUnban = (user: UserForManagement) => {
        runAction(() => unbanUser(user.id), `${user.name} has been unbanned`);
    };

    const handleDelete = () => {
        if (!selectedUser) return;
        runAction(() => deleteUser(selectedUser.id), `${selectedUser.name} has been deleted`, () => {
            setDeleteDialogOpen(false);
            setSelectedUser(null);
        });
    };

    const handleMakeAdmin = (user: UserForManagement) => {
        runAction(() => updateUserRole(user.id, "admin"), `${user.name} is now an admin`);
    };

    const handleMakeTeacher = (user: UserForManagement) => {
        runAction(() => updateUserRole(user.id, "teacher"), `${user.name} is now a teacher`);
    };

    const handleRemoveRole = (user: UserForManagement) => {
        runAction(() => updateUserRole(user.id, "student"), `${user.name} role removed (now student)`);
    };

    const getRoleBadge = (role: string | null, banned: boolean | null) => {
        if (banned) {
            return <Badge variant="destructive">Banned</Badge>;
        }
        switch (role) {
            case "admin":
                return <Badge className="bg-purple-600">Admin</Badge>;
            case "teacher":
                return <Badge className="bg-blue-600">Teacher</Badge>;
            default:
                return <Badge variant="secondary">Student</Badge>;
        }
    };

    return (
        <>
            <div className="rounded-lg border border-border/80 bg-white shadow-sm dark:bg-zinc-950/80 dark:border-zinc-800 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50 dark:bg-zinc-900/50">
                            <TableHead className="px-5 py-4">User</TableHead>
                            <TableHead className="px-5 py-4">Role</TableHead>
                            <TableHead className="px-5 py-4">Enrollments</TableHead>
                            <TableHead className="px-5 py-4">Courses Created</TableHead>
                            <TableHead className="px-5 py-4">Joined</TableHead>
                            <TableHead className="w-[80px] px-5 py-4">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-16 px-5">
                                    No users in this category
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="px-5 py-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <Avatar className="h-10 w-10 shrink-0">
                                                <AvatarImage src={user.image || undefined} alt={user.name} />
                                                <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 space-y-0.5">
                                                <p className="font-medium truncate">{user.name}</p>
                                                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-5 py-4">{getRoleBadge(user.role, user.banned)}</TableCell>
                                    <TableCell className="px-5 py-4">{user._count.enrollment}</TableCell>
                                    <TableCell className="px-5 py-4">{user._count.courses}</TableCell>
                                    <TableCell className="px-5 py-4">{format(new Date(user.createdAt), "MMM d, yyyy")}</TableCell>
                                    <TableCell className="px-5 py-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={isPending}>
                                                    <IconDotsVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {user.banned ? (
                                                    <DropdownMenuItem onClick={() => handleUnban(user)}>
                                                        <IconUserCheck className="mr-2 h-4 w-4" />
                                                        Unban User
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleBan(user)}>
                                                        <IconBan className="mr-2 h-4 w-4" />
                                                        Ban User
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                {user.role !== "admin" && (
                                                    <DropdownMenuItem onClick={() => handleMakeAdmin(user)}>
                                                        <IconShield className="mr-2 h-4 w-4" />
                                                        Make Admin
                                                    </DropdownMenuItem>
                                                )}
                                                {user.role !== "teacher" && (
                                                    <DropdownMenuItem onClick={() => handleMakeTeacher(user)}>
                                                        <IconShield className="mr-2 h-4 w-4" />
                                                        Make Teacher
                                                    </DropdownMenuItem>
                                                )}
                                                {(user.role === "admin" || user.role === "teacher") && (
                                                    <DropdownMenuItem onClick={() => handleRemoveRole(user)}>
                                                        <IconShield className="mr-2 h-4 w-4" />
                                                        Remove Role
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <IconTrash className="mr-2 h-4 w-4" />
                                                    Delete User
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
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
                            All their data including enrollments, progress, and courses will be permanently deleted.
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
