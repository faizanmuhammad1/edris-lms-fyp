"use client";

import { createPost } from "@/app/actions/community";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// Mirrors the server-side limits in app/actions/community.ts.
const TITLE_MAX = 100;
const CONTENT_MAX = 10000;

const postSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(TITLE_MAX, { message: `Title must be at most ${TITLE_MAX} characters` }),
  content: z
    .string()
    .trim()
    .min(10, { message: "Post must be at least 10 characters" })
    .max(CONTENT_MAX, { message: `Post must be at most ${CONTENT_MAX.toLocaleString()} characters` }),
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
  const contentLength = useWatch({ control: form.control, name: "content" })?.length ?? 0;

  function onSubmit(values: PostSchemaType) {
    if (pending) return;
    startTransition(async () => {
      try {
        const result = await createPost(communityId, values);

        if (!result.success) {
          toast.error(result.error || "We couldn't publish your post. Please try again.");
          return;
        }

        toast.success("Post published");
        form.reset();
        setIsExpanded(false);
        router.refresh();
      } catch {
        toast.error("We couldn't publish your post. Please try again.");
      }
    });
  }

  if (!isExpanded) {
    return (
      <Button onClick={() => setIsExpanded(true)} size="lg" className="w-full" aria-expanded={false}>
        <Plus aria-hidden="true" />
        Create new post
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-lg font-semibold">Create a new post</h2>
        </CardTitle>
        <CardDescription>Share a question, tip or idea with the community.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="What's on your mind?"
                      maxLength={TITLE_MAX}
                      autoFocus
                      disabled={pending}
                      className="h-10"
                      {...field}
                    />
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
                  <FormLabel>Post</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add details so others can help…"
                      className="min-h-[140px]"
                      maxLength={CONTENT_MAX}
                      disabled={pending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-right tabular-nums">
                    {contentLength.toLocaleString()}/{CONTENT_MAX.toLocaleString()}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                size="lg"
                type="button"
                disabled={pending}
                onClick={() => {
                  form.reset();
                  setIsExpanded(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
                {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
                {pending ? "Publishing…" : "Publish post"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
