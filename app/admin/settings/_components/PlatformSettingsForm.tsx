"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { savePlatformSettingsAction } from "../actions";

type PlatformSettingsFormProps = {
  platformName: string;
  supportEmail: string;
};

export function PlatformSettingsForm({ platformName, supportEmail }: PlatformSettingsFormProps) {
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await savePlatformSettingsAction(formData);
      if (result.ok) {
        toast.success("Platform settings saved.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Platform Settings</CardTitle>
            <CardDescription>
              Platform name and support email shown in outgoing emails (header, footer and
              subject lines). Site pages still use the built-in name.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="platform-name">Platform Name</Label>
            <Input
              id="platform-name"
              name="platformName"
              defaultValue={platformName}
              placeholder="Edris LMS"
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="support-email">Support Email</Label>
            <Input
              id="support-email"
              name="supportEmail"
              type="email"
              defaultValue={supportEmail}
              placeholder="support@example.com"
              disabled={pending}
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
