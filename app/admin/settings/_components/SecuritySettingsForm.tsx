"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Shield } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
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
import { Switch } from "@/components/ui/switch";
import { saveSecuritySettingsAction } from "../actions";
import {
  SESSION_TIMEOUT_MAX,
  SESSION_TIMEOUT_MIN,
  securitySettingsSchema,
  type SecuritySettingsValues,
} from "../schemas";
import { SettingsCard, SettingsFormActions } from "./SettingsCard";

type SecuritySettingsFormProps = SecuritySettingsValues;

export function SecuritySettingsForm({ sessionTimeoutEnabled, sessionTimeoutMinutes }: SecuritySettingsFormProps) {
  const form = useForm<SecuritySettingsValues>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: { sessionTimeoutEnabled, sessionTimeoutMinutes },
    mode: "onTouched",
  });
  const { isDirty, isSubmitting } = form.formState;
  const timeoutEnabled = useWatch({ control: form.control, name: "sessionTimeoutEnabled" });

  async function onSubmit(values: SecuritySettingsValues) {
    try {
      const result = await saveSecuritySettingsAction(values);
      if (result.status === "success") {
        toast.success(result.message);
        form.reset(values);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Couldn't save security settings. Check your connection and try again.");
    }
  }

  return (
    <SettingsCard
      id="security-settings"
      title="Security"
      icon={Shield}
      badge={<StatusBadge tone="warning">Not yet enforced</StatusBadge>}
      description="Session and access controls for signed-in users."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <p className="rounded-lg border border-amber-600/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
            <span className="font-medium">Not yet enforced:</span> the timeout is saved, but sessions
            currently follow the default sign-in expiry and users are not logged out for inactivity.
          </p>
          <fieldset className="space-y-5" disabled={isSubmitting}>
            <legend className="sr-only">Session timeout</legend>
            <FormField
              control={form.control}
              name="sessionTimeoutEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 space-y-0 rounded-lg border p-3 sm:p-4">
                  <div className="min-w-0 space-y-1">
                    <FormLabel className="cursor-pointer text-sm font-medium">Inactivity timeout</FormLabel>
                    <FormDescription>Sign users out after a period without activity.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} onBlur={field.onBlur} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sessionTimeoutMinutes"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>Timeout length (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={SESSION_TIMEOUT_MIN}
                      max={SESSION_TIMEOUT_MAX}
                      step={1}
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={Number.isNaN(field.value) ? "" : field.value}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? Number.NaN : e.target.valueAsNumber)
                      }
                      disabled={!timeoutEnabled || isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Between {SESSION_TIMEOUT_MIN} and {SESSION_TIMEOUT_MAX} minutes.
                    {!timeoutEnabled && " Turn on the inactivity timeout to change it."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </fieldset>
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
