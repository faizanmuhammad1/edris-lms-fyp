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
import { IconDotsVertical, IconBan, IconUserCheck, IconTrash, IconShield } from "@tabler/icons-react";
import { banUser, unbanUser, deleteUser, updateUserRole } from "../actions";
import { toast } from "sonner";
import { format } from "date-fns";

interface User {
    id: string;
    name: string;
    email: string;
    role: string | null;
    banned: boolean | null;
    banReason: string | null;
    createdAt: Date;
    _count: {
        enrollment: number;
        courses: number;
    };
}

export function UserManagementTable({ users }: { users: User[] }) {
    const [isPending, startTransition] = useTransition();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const handleBan = (user: User) => {
        startTransition(async () => {
            await banUser(user.id, "Banned by admin");
            toast.success(`${user.name} has been banned`);
        });
    };

    const handleUnban = (user: User) => {
        startTransition(async () => {
            await unbanUser(user.id);
            toast.success(`${user.name} has been unbanned`);
        });
    };

    const handleDelete = () => {
        if (!selectedUser) return;
        startTransition(async () => {
            await deleteUser(selectedUser.id);
            toast.success(`${selectedUser.name} has been deleted`);
            setDeleteDialogOpen(false);
            setSelectedUser(null);
        });
    };

    const handleMakeAdmin = (user: User) => {
        startTransition(async () => {
            await updateUserRole(user.id, "admin");
            toast.success(`${user.name} is now an admin`);
        });
    };

    const handleMakeTeacher = (user: User) => {
        startTransition(async () => {
            await updateUserRole(user.id, "teacher");
            toast.success(`${user.name} is now a teacher`);
        });
    };

    const handleRemoveRole = (user: User) => {
        startTransition(async () => {
            await updateUserRole(user.id, "student");
            toast.success(`${user.name} role removed (now student)`);
        });
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
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Enrollments</TableHead>
                            <TableHead>Courses Created</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="w-[70px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{user.name}</p>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getRoleBadge(user.role, user.banned)}</TableCell>
                                    <TableCell>{user._count.enrollment}</TableCell>
                                    <TableCell>{user._count.courses}</TableCell>
                                    <TableCell>{format(new Date(user.createdAt), "MMM d, yyyy")}</TableCell>
                                    <TableCell>
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
