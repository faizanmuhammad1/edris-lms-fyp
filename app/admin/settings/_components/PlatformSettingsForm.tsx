"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { savePlatformSettingsAction } from "../actions";
import { platformSettingsSchema, type PlatformSettingsValues } from "../schemas";
import { SettingsCard, SettingsFormActions } from "./SettingsCard";

type PlatformSettingsFormProps = {
  platformName: string;
  supportEmail: string;
};

export function PlatformSettingsForm({ platformName, supportEmail }: PlatformSettingsFormProps) {
  const form = useForm<PlatformSettingsValues>({
    resolver: zodResolver(platformSettingsSchema),
    defaultValues: { platformName, supportEmail },
    mode: "onTouched",
  });
  const { isDirty, isSubmitting } = form.formState;

  async function onSubmit(values: PlatformSettingsValues) {
    try {
      const result = await savePlatformSettingsAction(values);
      if (result.status === "success") {
        toast.success(result.message);
        form.reset(values);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Couldn't save platform settings. Check your connection and try again.");
    }
  }

  return (
    <SettingsCard
      id="platform-settings"
      title="Platform"
      icon={Settings}
      description="Name and contact address used in outgoing emails (header, footer and subject lines). Site pages still show the built-in name."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="platformName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform name</FormLabel>
                <FormControl>
                  <Input placeholder="Edris LMS" autoComplete="organization" maxLength={100} {...field} />
                </FormControl>
                <FormDescription>2–100 characters. Appears in email subjects and footers.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supportEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Support email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="support@yourdomain.com"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Shown as the &quot;Questions? Contact…&quot; line in emails. Placeholder addresses at
                  example.com are hidden from emails.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <SettingsFormActions
            isDirty={isDirty}
            isSubmitting={isSubmitting}
            onDiscard={() => form.reset()}
          />
        </form>
      </Form>
    </SettingsCard>
  );
}
