"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateStudentProfile } from "../actions";
import { Loader2 } from "lucide-react";

const NAME_MIN = 2;
const NAME_MAX = 100;

interface SettingsFormProps {
  initialData: {
    name: string;
    email: string;
  };
}

function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < NAME_MIN) return `Name must be at least ${NAME_MIN} characters.`;
  if (trimmed.length > NAME_MAX) return `Name must be ${NAME_MAX} characters or fewer.`;
  return null;
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData.name);
  const [savedName, setSavedName] = useState(initialData.name);
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const id = useId();

  const clientError = validateName(name);
  const error = (touched && clientError) || serverError;
  const isDirty = name.trim() !== savedName.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (pending || clientError || !isDirty) return;

    startTransition(async () => {
      try {
        const result = await updateStudentProfile({ name });
        if (result.status === "success") {
          setSavedName(name.trim());
          setServerError(null);
          toast.success("Your profile has been updated");
          router.refresh();
        } else {
          setServerError(result.message);
          toast.error(result.message);
        }
      } catch {
        const message = "We couldn't update your profile. Please try again.";
        setServerError(message);
        toast.error(message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5 md:grid-cols-2">
      <div className="grid content-start gap-2">
        <Label htmlFor={`${id}-name`}>Display name</Label>
        <Input
          id={`${id}-name`}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (serverError) setServerError(null);
          }}
          onBlur={() => setTouched(true)}
          placeholder="Your name"
          autoComplete="name"
          maxLength={NAME_MAX}
          disabled={pending}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-name-error` : `${id}-name-hint`}
          className="h-10"
        />
        {error ? (
          <p id={`${id}-name-error`} className="text-sm text-destructive">
            {error}
          </p>
        ) : (
          <p id={`${id}-name-hint`} className="text-xs text-muted-foreground">
            Shown on your comments, reviews and forum posts.
          </p>
        )}
      </div>
      <div className="grid content-start gap-2">
        <Label htmlFor={`${id}-email`}>Email</Label>
        <Input
          id={`${id}-email`}
          type="email"
          value={initialData.email}
          readOnly
          aria-describedby={`${id}-email-hint`}
          className="h-10 bg-muted"
        />
        <p id={`${id}-email-hint`} className="text-xs text-muted-foreground">
          To change your email, contact support.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end md:col-span-2">
        {isDirty && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            disabled={pending}
            onClick={() => {
              setName(savedName);
              setTouched(false);
              setServerError(null);
            }}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" size="lg" disabled={pending || !isDirty} aria-busy={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
