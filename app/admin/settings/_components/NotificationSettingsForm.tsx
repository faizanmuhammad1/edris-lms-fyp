"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bell } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { saveNotificationSettingsAction } from "../actions";
import { notificationSettingsSchema, type NotificationSettingsValues } from "../schemas";
import { SettingsCard, SettingsFormActions } from "./SettingsCard";

type NotificationSettingsFormProps = NotificationSettingsValues;

const OPTIONS: { name: keyof NotificationSettingsValues; label: string; description: string }[] = [
  {
    name: "notifyNewEnrollments",
    label: "New enrollments",
    description: "Email admins when a student enrolls in a course.",
  },
  {
    name: "notifyTeacherApplications",
    label: "Teacher applications",
    description: "Email admins when a new teacher application arrives.",
  },
  {
    name: "notifySystemAlerts",
    label: "System alerts",
    description: "Email admins about important system warnings and updates.",
  },
];

export function NotificationSettingsForm({
  notifyNewEnrollments,
  notifyTeacherApplications,
  notifySystemAlerts,
}: NotificationSettingsFormProps) {
  const form = useForm<NotificationSettingsValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: { notifyNewEnrollments, notifyTeacherApplications, notifySystemAlerts },
  });
  const { isDirty, isSubmitting } = form.formState;

  async function onSubmit(values: NotificationSettingsValues) {
    try {
      const result = await saveNotificationSettingsAction(values);
      if (result.status === "success") {
        toast.success(result.message);
        form.reset(values);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Couldn't save notification preferences. Check your connection and try again.");
    }
  }

  return (
    <SettingsCard
      id="notification-settings"
      title="Notifications"
      icon={Bell}
      badge={<StatusBadge tone="warning">Not yet enforced</StatusBadge>}
      description="Choose which events should notify admins."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <p className="rounded-lg border border-amber-600/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
            <span className="font-medium">Not yet enforced:</span> these preferences are saved, but the
            platform doesn&apos;t send notifications for these events yet.
          </p>
          <fieldset className="divide-y rounded-lg border" disabled={isSubmitting}>
            <legend className="sr-only">Admin notification events</legend>
            {OPTIONS.map((option) => (
              <FormField
                key={option.name}
                control={form.control}
                name={option.name}
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4 space-y-0 p-3 sm:p-4">
                    <div className="min-w-0 space-y-1">
                      <FormLabel className="cursor-pointer text-sm font-medium">{option.label}</FormLabel>
                      <FormDescription>{option.description}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} onBlur={field.onBlur} />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </fieldset>
          <SettingsFormActions
            isDirty={isDirty}
            isSubmitting={isSubmitting}
            onDiscard={() => form.reset()}
            saveLabel="Save preferences"
          />
        </form>
      </Form>
    </SettingsCard>
  );
}
