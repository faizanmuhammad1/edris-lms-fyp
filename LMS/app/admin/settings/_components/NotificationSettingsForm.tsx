"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { saveNotificationSettingsAction } from "../actions";

type NotificationSettingsFormProps = {
  notifyNewEnrollments: boolean;
  notifyTeacherApplications: boolean;
  notifySystemAlerts: boolean;
};

export function NotificationSettingsForm({
  notifyNewEnrollments: initialNewEnrollments,
  notifyTeacherApplications: initialTeacherApplications,
  notifySystemAlerts: initialSystemAlerts,
}: NotificationSettingsFormProps) {
  const [pending, startTransition] = useTransition();
  const [notifyNewEnrollments, setNotifyNewEnrollments] = useState(initialNewEnrollments);
  const [notifyTeacherApplications, setNotifyTeacherApplications] = useState(initialTeacherApplications);
  const [notifySystemAlerts, setNotifySystemAlerts] = useState(initialSystemAlerts);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveNotificationSettingsAction({
        notifyNewEnrollments,
        notifyTeacherApplications,
        notifySystemAlerts,
      });
      if (result.ok) toast.success("Notification settings saved.");
      else toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Configure email and push notifications</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New Enrollments</p>
              <p className="text-sm text-muted-foreground">
                Receive notifications for new course enrollments
              </p>
            </div>
            <Switch checked={notifyNewEnrollments} onCheckedChange={setNotifyNewEnrollments} disabled={pending} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Teacher Applications</p>
              <p className="text-sm text-muted-foreground">
                Get notified when new teacher applications arrive
              </p>
            </div>
            <Switch checked={notifyTeacherApplications} onCheckedChange={setNotifyTeacherApplications} disabled={pending} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">System Alerts</p>
              <p className="text-sm text-muted-foreground">
                Important system warnings and updates
              </p>
            </div>
            <Switch checked={notifySystemAlerts} onCheckedChange={setNotifySystemAlerts} disabled={pending} />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
