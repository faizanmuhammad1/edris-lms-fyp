"use client";

import { deleteCommunity, updateCommunity } from "@/app/actions/community";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;

// Mirrors the server-side rules in app/actions/community.ts
const detailsSchema = z.object({
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

type DetailsValues = z.infer<typeof detailsSchema>;

/** Edit a community's name and description. */
export function CommunityDetailsForm({ slug, initialValues }: { slug: string; initialValues: DetailsValues }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: initialValues,
  });

  const description = useWatch({ control: form.control, name: "description" });
  const isDirty = form.formState.isDirty;

  function onSubmit(values: DetailsValues) {
    startTransition(async () => {
      try {
        const result = await updateCommunity(slug, values);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success(result.message ?? "Community details saved");
        form.reset(values);
        router.refresh();
      } catch {
        toast.error("Something went wrong while saving. Please try again.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold leading-none">Community details</h3>
        <CardDescription>Shown to students on the forum list and before they join.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="max-w-2xl space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Community name</FormLabel>
                  <FormControl>
                    <Input maxLength={NAME_MAX} autoComplete="off" disabled={pending} {...field} />
                  </FormControl>
                  <FormDescription>Renaming doesn&apos;t change the community&apos;s link.</FormDescription>
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
                    <Textarea className="min-h-32" maxLength={DESCRIPTION_MAX} disabled={pending} {...field} />
                  </FormControl>
                  <FormDescription>Between 10 and {DESCRIPTION_MAX} characters.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="submit" className="h-10" disabled={pending || !isDirty} aria-busy={pending}>
                {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
                {pending ? "Saving..." : "Save changes"}
              </Button>
              {isDirty && !pending && (
                <Button type="button" variant="ghost" className="h-10" onClick={() => form.reset(initialValues)}>
                  Discard changes
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

interface DeleteCommunityCardProps {
  slug: string;
  name: string;
  memberCount: number;
  postCount: number;
}

/** Danger zone: permanently delete the community. */
export function DeleteCommunityCard({ slug, name, memberCount, postCount }: DeleteCommunityCardProps) {
  const router = useRouter();

  async function handleDelete() {
    try {
      const result = await deleteCommunity(slug);
      if (!result.success) {
        toast.error(result.error);
        return false;
      }
      toast.success(`"${name}" was deleted`);
      router.push("/teacher/communities");
      router.refresh();
    } catch {
      toast.error("Something went wrong while deleting the community. Please try again.");
      return false;
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <h3 className="font-semibold leading-none text-destructive">Delete community</h3>
        <CardDescription>
          Permanently removes the community, its posts and comments, and the member and ban lists. This can&apos;t be
          undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConfirmDialog
          title="Delete this community?"
          description={
            <div className="space-y-2">
              <p>
                <span className="font-medium break-words text-foreground">&ldquo;{name}&rdquo;</span> will be
                permanently deleted, including {postCount} {postCount === 1 ? "post" : "posts"} with their comments and{" "}
                {memberCount} {memberCount === 1 ? "membership" : "memberships"}.
              </p>
              <p>Students will lose access immediately. This can&apos;t be undone.</p>
            </div>
          }
          confirmLabel="Delete community"
          destructive
          onConfirm={handleDelete}
          trigger={
            <Button variant="destructive" className="h-10">
              <Trash2 aria-hidden="true" />
              Delete community
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
}
