"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { unsubscribeByEmail } from "@/app/actions/newsletter";

export function UnsubscribeForm() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await unsubscribeByEmail(email);
      if (result.ok) {
        router.push("/?unsubscribed=1");
      } else {
        router.push("/?unsubscribe=error");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Unsubscribing…" : "Unsubscribe"}
      </Button>
    </form>
  );
}
