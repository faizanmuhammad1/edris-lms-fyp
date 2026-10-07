"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
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
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <p className="text-sm">
        Email address: <span className="font-medium break-all">{email}</span>
      </p>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Unsubscribing…" : "Unsubscribe"}
      </Button>
    </form>
  );
}
