"use client";

import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateTeacherProfile } from "../actions";

const NAME_MAX = 100;

// Mirrors the server-side rules in ../actions.ts
const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(NAME_MAX, { message: `Name must be at most ${NAME_MAX} characters` }),
});

type ProfileValues = z.infer<typeof profileSchema>;

interface TeacherProfileFormProps {
  name: string;
  email: string;
}

export function TeacherProfileForm({ name, email }: TeacherProfileFormProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name },
  });

  const isDirty = form.formState.isDirty;

  function onSubmit(values: ProfileValues) {
    startTransition(async () => {
      try {
        const result = await updateTeacherProfile(values);
        if (result.status === "success") {
          toast.success(result.message);
          form.reset(values);
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Something went wrong while saving your profile. Please try again.");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display name</FormLabel>
                <FormControl>
                  <Input autoComplete="name" maxLength={NAME_MAX} disabled={pending} {...field} />
                </FormControl>
                <FormDescription>Shown on your courses, reviews and community posts.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid content-start gap-2">
            <Label htmlFor="teacher-email">Email</Label>
            <Input
              id="teacher-email"
              type="email"
              value={email}
              readOnly
              disabled
              aria-describedby="teacher-email-help"
              className="w-full"
            />
            <p id="teacher-email-help" className="text-sm text-muted-foreground">
              Used to sign in. Open a support ticket to change it.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="submit" className="h-10" disabled={pending || !isDirty} aria-busy={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
            {pending ? "Saving..." : "Save profile"}
          </Button>
          {isDirty && !pending && (
            <Button type="button" variant="ghost" className="h-10" onClick={() => form.reset({ name })}>
              Discard changes
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
