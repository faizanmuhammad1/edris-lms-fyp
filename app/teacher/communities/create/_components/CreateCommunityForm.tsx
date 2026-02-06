"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTransition } from "react";
import { toast } from "sonner";
import { createCommunity } from "@/app/actions/community";

const communitySchema = z.object({
    name: z
        .string()
        .min(3, { message: "Name must be at least 3 characters long" })
        .max(100, { message: "Name must be at most 100 characters long" }),
    description: z
        .string()
        .min(10, { message: "Description must be at least 10 characters long" })
        .max(500, { message: "Description must be at most 500 characters long" }),
    courseId: z.string().min(1, { message: "Please select a course" }),
});

type CommunitySchemaType = z.infer<typeof communitySchema>;

interface Course {
    id: string;
    title: string;
}

export function CreateCommunityForm({ courses }: { courses: Course[] }) {
    const [pending, startTransition] = useTransition();

    const form = useForm<CommunitySchemaType>({
        resolver: zodResolver(communitySchema),
        defaultValues: {
            name: "",
            description: "",
            courseId: "",
        },
    });

    function onSubmit(values: CommunitySchemaType) {
        startTransition(async () => {
            const { error } = await createCommunity(values);

            if (error) {
                toast.error("Failed to create community");
                return;
            }

            toast.success("Community created successfully!");
            form.reset();
            window.location.href = "/teacher/communities";
        });
    }

    return (
        <>
            <div className="flex items-center gap-4">
                <Link
                    href="/teacher/communities"
                    className={buttonVariants({
                        variant: "outline",
                        size: "icon",
                    })}
                >
                    <ArrowLeft className="size-4" />
                </Link>
                <h1 className="text-2xl font-bold">Create Community</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Community Information</CardTitle>
                    <CardDescription>
                        Create a community forum for students enrolled in one of your courses
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                            <FormField
                                control={form.control}
                                name="courseId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Select Course</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a course for this community" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {courses.map((course) => (
                                                    <SelectItem key={course.id} value={course.id}>
                                                        {course.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Community Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Web Development Discussion" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe what this community is about..."
                                                className="min-h-[120px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" disabled={pending}>
                                {pending ? (
                                    <>
                                        Creating...
                                        <Loader2 className="animate-spin ml-1" />
                                    </>
                                ) : (
                                    <>
                                        Create Community <PlusIcon className="ml-1" size={16} />
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </>
    );
}
