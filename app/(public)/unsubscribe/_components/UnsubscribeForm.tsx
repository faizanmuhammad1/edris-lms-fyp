"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { unsubscribeByEmail } from "@/app/actions/newsletter";

type UnsubscribeFormProps = {
  email: string;
  /** Signed token from the campaign email link. */
  token: string;
};

export function UnsubscribeForm({ email, token }: UnsubscribeFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await unsubscribeByEmail(email, token);
      if (result.ok) {
        router.push("/?unsubscribed=1");
      } else {
        router.push("/?unsubscribe=error");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Email address: <span className="break-all font-medium text-foreground">{email}</span>
      </p>
      <Button type="submit" disabled={isPending} className="h-11 w-full sm:w-auto">
        {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {isPending ? "Unsubscribing…" : "Unsubscribe"}
      </Button>
    </form>
  );
}
