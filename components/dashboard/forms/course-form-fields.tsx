"use client";

import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { Uploader } from "@/components/file-uploader/Uploader";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { courseCategories, courseLevels, CourseSchemaType, courseStatus } from "@/lib/zodSchemas";
import { Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import slugify from "slugify";

export const toSlug = (value: string) => slugify(value ?? "", { lower: true, strict: true, trim: true });

const STATUS_HELP: Record<(typeof courseStatus)[number], string> = {
  Draft: "Only you can see this course. Publish it when it's ready.",
  Published: "Listed in the course catalog and open for enrollment.",
  Archived: "Hidden from the catalog. Use this to retire a course.",
};

function FieldGroup({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0 space-y-5">
      <legend className="mb-4 space-y-1">
        <span className="block text-base font-semibold">{title}</span>
        {description && <span className="block text-sm text-muted-foreground">{description}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

/** Integer-only number input bound to a react-hook-form field (empty string -> undefined). */
function IntegerInput({
  value,
  onChange,
  onBlur,
  name,
  min,
  max,
  placeholder,
  ...rest
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur: () => void;
  name: string;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <Input
      {...rest}
      name={name}
      type="number"
      inputMode="numeric"
      step={1}
      min={min}
      max={max}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      onBlur={onBlur}
      onKeyDown={(e) => {
        // Prices and durations are whole numbers.
        if (e.key === "." || e.key === "," || e.key === "e" || e.key === "E") e.preventDefault();
      }}
    />
  );
}

/**
 * All course fields (details, thumbnail, settings) shared by the create and edit forms.
 * Two columns from large content widths; a single column on phones and tablets.
 */
export function CourseFormFields({
  form,
  autoSlug = false,
  persistedFileKey,
}: {
  form: UseFormReturn<CourseSchemaType>;
  /** Fill the slug from the title while the slug hasn't been edited by hand (create form). */
  autoSlug?: boolean;
  /** Thumbnail key currently saved in the database (edit form), so the uploader never deletes it. */
  persistedFileKey?: string;
}) {
  const slug = form.watch("slug");
  const smallDescription = form.watch("smallDescription") ?? "";
  const status = form.watch("status");

  return (
    <div className="grid gap-10 @5xl/main:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <FieldGroup title="Course details" description="What students see on the course page.">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Strength Training for Beginners"
                  maxLength={100}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    if (autoSlug && !form.getFieldState("slug").isDirty) {
                      form.setValue("slug", toSlug(e.target.value), { shouldValidate: form.formState.isSubmitted });
                    }
                  }}
                />
              </FormControl>
              <FormDescription>3–100 characters.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL slug</FormLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <FormControl>
                  <Input
                    placeholder="strength-training-for-beginners"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    {...field}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 shrink-0 hover:scale-100"
                  onClick={() =>
                    form.setValue("slug", toSlug(form.getValues("title")), {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                >
                  <Sparkles aria-hidden="true" />
                  Generate from title
                </Button>
              </div>
              <FormDescription className="break-all">
                Course address: /courses/{slug || "your-course"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="smallDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="One or two sentences shown on course cards."
                  className="min-h-24"
                  maxLength={200}
                  {...field}
                />
              </FormControl>
              <div className="flex justify-between gap-4">
                <FormDescription>Shown on course cards and in search results.</FormDescription>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground" aria-hidden="true">
                  {smallDescription.length}/200
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full description</FormLabel>
              <FormControl>
                <RichTextEditor field={field} />
              </FormControl>
              <FormDescription>What students will learn, who it&apos;s for and any requirements.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </FieldGroup>

      <div className="min-w-0 space-y-10">
        <FieldGroup title="Thumbnail" description="A 16:9 image works best (e.g. 1280×720).">
          <FormField
            control={form.control}
            name="fileKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Thumbnail image</FormLabel>
                <FormControl>
                  <Uploader
                    fileTypeAccepted="image"
                    onChange={field.onChange}
                    value={field.value}
                    persistedKey={persistedFileKey}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FieldGroup>

        <FieldGroup title="Settings">
          <div className="grid gap-5 sm:grid-cols-2 @5xl/main:grid-cols-1">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courseCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courseLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (hours)</FormLabel>
                  <FormControl>
                    <IntegerInput
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      min={1}
                      max={500}
                      placeholder="e.g. 12"
                    />
                  </FormControl>
                  <FormDescription>Whole hours, 1–500.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (USD)</FormLabel>
                  <FormControl>
                    <IntegerInput
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      min={1}
                      placeholder="e.g. 49"
                    />
                  </FormControl>
                  <FormDescription>Whole dollars, at least $1.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="sm:col-span-2 @5xl/main:col-span-1">
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courseStatus.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {status && <FormDescription>{STATUS_HELP[status]}</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FieldGroup>
      </div>
    </div>
  );
}

/** Warns before closing/reloading the tab while the form has unsaved changes. */
export function useUnsavedChangesWarning(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled]);
}

/** Cancel + submit row. Cancel asks before discarding unsaved changes. */
export function CourseFormActions({
  cancelHref,
  isDirty,
  pending,
  submitLabel,
  pendingLabel,
  submitDisabled,
  submitIcon,
}: {
  cancelHref: string;
  isDirty: boolean;
  pending: boolean;
  submitLabel: string;
  pendingLabel: string;
  submitDisabled?: boolean;
  submitIcon?: ReactNode;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-end">
      {isDirty && !pending && (
        <p className="text-sm text-muted-foreground sm:mr-auto" role="status">
          You have unsaved changes.
        </p>
      )}
      {isDirty ? (
        <Button
          type="button"
          variant="outline"
          className="h-10 hover:scale-100"
          disabled={pending}
          onClick={() => setConfirmOpen(true)}
        >
          Cancel
        </Button>
      ) : (
        <Link href={cancelHref} className={buttonVariants({ variant: "outline", className: "h-10 hover:scale-100" })}>
          Cancel
        </Link>
      )}
      <Button type="submit" className="h-10 hover:scale-100" disabled={pending || submitDisabled} aria-busy={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : submitIcon}
        {pending ? pendingLabel : submitLabel}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Discard unsaved changes?"
        description="Your changes to this course haven't been saved and will be lost."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        destructive
        onConfirm={() => router.push(cancelHref)}
      />
    </div>
  );
}

/** Messages that clearly belong to the slug field are shown inline under it. */
export function isSlugError(message: string) {
  return /slug/i.test(message);
}
