"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";

const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;

const communitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters.")
    .max(NAME_MAX, `Name must be ${NAME_MAX} characters or fewer.`),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters.")
    .max(DESCRIPTION_MAX, `Description must be ${DESCRIPTION_MAX} characters or fewer.`),
});

type CommunitySchemaType = z.infer<typeof communitySchema>;

const LIST_HREF = "/admin/communities";

export function CreateCommunityForm() {
  const router = useRouter();
  const form = useForm<CommunitySchemaType>({
    resolver: zodResolver(communitySchema),
    defaultValues: { name: "", description: "" },
    mode: "onTouched",
  });
  const { isSubmitting } = form.formState;
  const descriptionLength = useWatch({ control: form.control, name: "description" }).length;

  async function onSubmit(values: CommunitySchemaType) {
    try {
      const result = await createCommunity(values);
      if (!result.success) {
        toast.error(result.error || "Couldn't create the community. Please try again.");
        return;
      }
      toast.success(`“${values.name}” created.`);
      router.push(LIST_HREF);
    } catch {
      toast.error("Couldn't create the community. Check your connection and try again.");
    }
  }

  return (
    <Card className="max-w-2xl gap-5 shadow-xs">
      <CardHeader className="px-4 sm:px-6">
        <h2 className="text-base font-semibold leading-tight sm:text-lg">Community details</h2>
        <CardDescription>
          Admin-created communities are platform-wide and not linked to a course. Teachers create
          course communities from their own dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <fieldset className="space-y-6" disabled={isSubmitting}>
              <legend className="sr-only">Community details</legend>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Community name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Web Development Discussion" maxLength={NAME_MAX} {...field} />
                    </FormControl>
                    <FormDescription>
                      3–{NAME_MAX} characters. The community&apos;s web address is generated from the name and
                      must be unique.
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what members can discuss here…"
                        className="min-h-32"
                        maxLength={DESCRIPTION_MAX}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="flex flex-wrap justify-between gap-x-4">
                      <span>10–{DESCRIPTION_MAX} characters, shown on the forum page.</span>
                      <span className="tabular-nums">
                        {descriptionLength}/{DESCRIPTION_MAX}
                      </span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>

            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Link
                href={LIST_HREF}
                className={buttonVariants({ variant: "ghost" })}
              >
                Cancel
              </Link>
              <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="size-4" aria-hidden="true" />
                )}
                {isSubmitting ? "Creating…" : "Create community"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
