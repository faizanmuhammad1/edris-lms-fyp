"use client";

import { createCommunity } from "@/app/actions/community";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import slugify from "slugify";
import { toast } from "sonner";
import { z } from "zod";

const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;

// Mirrors the server-side rules in app/actions/community.ts
const communitySchema = z.object({
  courseId: z.string().min(1, { message: "Select the course this community belongs to" }),
  name: z
    .string()
    .trim()
    .min(3, { message: "Name must be at least 3 characters" })
    .max(NAME_MAX, { message: `Name must be at most ${NAME_MAX} characters` }),
  description: z
    .string()
    .trim()
    .min(10, { message: "Description must be at least 10 characters" })
    .max(DESCRIPTION_MAX, { message: `Description must be at most ${DESCRIPTION_MAX} characters` }),
});

type CommunitySchemaType = z.infer<typeof communitySchema>;

interface Course {
  id: string;
  title: string;
}

export function CreateCommunityForm({ courses }: { courses: Course[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<CommunitySchemaType>({
    resolver: zodResolver(communitySchema),
    defaultValues: {
      courseId: courses.length === 1 ? courses[0].id : "",
      name: "",
      description: "",
    },
  });

  const name = useWatch({ control: form.control, name: "name" });
  const description = useWatch({ control: form.control, name: "description" });
  // Same slug the server generates from the name
  const slugPreview = slugify(name, { lower: true });

  function onSubmit(values: CommunitySchemaType) {
    startTransition(async () => {
      try {
        const result = await createCommunity(values);

        if (!result.success) {
          toast.error(result.error);
          if (/name/i.test(result.error)) {
            form.setError("name", { message: result.error });
          }
          return;
        }

        toast.success(result.message ?? "Community created");
        router.push(`/teacher/communities/${result.data.slug}`);
        router.refresh();
      } catch {
        toast.error("Something went wrong while creating the community. Please try again.");
      }
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <h2 className="font-semibold leading-none">Community details</h2>
        <CardDescription>
          Only students with an active enrollment in the selected course can join and post.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={pending}>
                    <FormControl>
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue placeholder="Select one of your courses" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-w-[calc(100vw-2rem)]">
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          <span className="truncate">{course.title}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>The community is linked to this course and its enrolled students.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Community name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Web Development Study Group"
                      maxLength={NAME_MAX}
                      autoComplete="off"
                      disabled={pending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {slugPreview ? (
                      <>
                        Students will find it at{" "}
                        <span className="font-mono break-all text-foreground">/dashboard/forum/{slugPreview}</span>
                      </>
                    ) : (
                      "Must be unique. The community link is generated from the name."
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-baseline justify-between gap-2">
                    <FormLabel>Description</FormLabel>
                    <span className="text-xs tabular-nums text-muted-foreground" aria-hidden="true">
                      {description.length}/{DESCRIPTION_MAX}
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="What will students discuss here? Mention any posting guidelines."
                      className="min-h-32"
                      maxLength={DESCRIPTION_MAX}
                      disabled={pending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Between 10 and {DESCRIPTION_MAX} characters. Shown to students before they join.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Link
                href="/teacher/communities"
                className={buttonVariants({ variant: "outline", className: "h-10" })}
              >
                Cancel
              </Link>
              <Button type="submit" className="h-10" disabled={pending} aria-busy={pending}>
                {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
                {pending ? "Creating..." : "Create community"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
