"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Shield } from "lucide-react";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { saveSecuritySettingsAction } from "../actions";

type SecuritySettingsFormProps = {
  sessionTimeoutEnabled: boolean;
  sessionTimeoutMinutes: number;
};

export function SecuritySettingsForm({
  sessionTimeoutEnabled: sessionTimeoutEnabledProp,
  sessionTimeoutMinutes,
}: SecuritySettingsFormProps) {
  const [pending, startTransition] = useTransition();
  const [sessionTimeoutEnabled, setSessionTimeoutEnabled] = useState(sessionTimeoutEnabledProp);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveSecuritySettingsAction({
        sessionTimeoutEnabled,
        sessionTimeoutMinutes,
      });
      if (result.ok) toast.success("Security settings saved.");
      else toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <CardTitle>Security</CardTitle>
            <CardDescription>Security and access controls</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Session Timeout</p>
              <p className="text-sm text-muted-foreground">
                Auto-logout after 30 minutes of inactivity
              </p>
            </div>
            <Switch checked={sessionTimeoutEnabled} onCheckedChange={setSessionTimeoutEnabled} disabled={pending} />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
