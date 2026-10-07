"use client";

import { createPost } from "@/app/actions/community";
import { Button } from "@/components/ui/button";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const postSchema = z.object({
    title: z.string().min(3).max(100),
    content: z.string().min(10, { message: "Content must be at least 10 characters" }),
});

type PostSchemaType = z.infer<typeof postSchema>;

interface CreatePostFormProps {
    communityId: string;
}

export function CreatePostForm({ communityId }: CreatePostFormProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<PostSchemaType>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            title: "",
            content: "",
        },
    });

    function onSubmit(values: PostSchemaType) {
        startTransition(async () => {
            const result = await createPost(communityId, values);

            if (!result.success) {
                toast.error(result.error || "Failed to create post");
                return;
            }

            toast.success("Post created successfully!");
            form.reset();
            setIsExpanded(false);
            router.refresh();
        });
    }

    if (!isExpanded) {
        return (
            <Button onClick={() => setIsExpanded(true)} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create New Post
            </Button>
        )
    }

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Create a New Post</CardTitle>
                <CardDescription>Share your thoughts with the community</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="What's on your mind?" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Content</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Elaborate on your topic..."
                                            className="min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-2 justify-end">
                            <Button variant="ghost" type="button" onClick={() => setIsExpanded(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={pending}>
                                {pending ? (
                                    <>
                                        Posting...
                                        <Loader2 className="animate-spin ml-1" />
                                    </>
                                ) : (
                                    <>
                                        Post <Send className="ml-1" size={16} />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
