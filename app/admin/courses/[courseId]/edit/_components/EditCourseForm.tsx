"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import slugify from "slugify";
import { toast } from "sonner";
import { Loader2, Save, SparkleIcon } from "lucide-react";
import { AdminCourseSingularType } from "@/app/data/admin/admin-get-course";
import { Uploader } from "@/components/file-uploader/Uploader";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { tryCatch } from "@/hooks/try-catch";
import {
  courseCategories,
  courseLevels,
  courseSchema,
  CourseSchemaType,
  courseStatus,
} from "@/lib/zodSchemas";
import { editCourse } from "../actions";

interface EditCourseFormProps {
  data: AdminCourseSingularType;
}

const SMALL_DESCRIPTION_MAX = 200;

export function EditCourseForm({ data }: EditCourseFormProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<CourseSchemaType>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: data.title,
      description: data.description,
      fileKey: data.fileKey,
      price: data.price,
      duration: data.duration,
      level: data.level,
      category: data.category as CourseSchemaType["category"],
      status: data.status,
      slug: data.slug,
      smallDescription: data.smallDescription,
    },
  });

  function onSubmit(values: CourseSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(editCourse(values, data.id));

      if (error) {
        toast.error("Couldn't reach the server. Check your connection and try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        // Keep the saved values as the new baseline and pull fresh server data
        form.reset(values);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function onInvalid() {
    toast.error("Some fields need attention. Check the highlighted fields and try again.");
  }

  function generateSlug() {
    const title = form.getValues("title");
    if (!title?.trim()) {
      form.setError("slug", { message: "Enter a title first to generate a slug." });
      return;
    }
    form.setValue("slug", slugify(title), { shouldValidate: true, shouldDirty: true });
  }

  return (
    <Form {...form}>
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        aria-busy={pending}
        noValidate
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Introduction to Web Development" maxLength={100} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <FormControl>
                  <Input placeholder="introduction-to-web-development" className="min-w-0" {...field} />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={generateSlug}
                >
                  <SparkleIcon aria-hidden="true" />
                  Generate from title
                </Button>
              </div>
              <FormDescription className="break-all">
                Used in the course URL: /courses/{field.value || "your-slug"}
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
                  placeholder="A one or two sentence summary shown on course cards"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {field.value?.length ?? 0}/{SMALL_DESCRIPTION_MAX} characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel id="course-description-label">Description</FormLabel>
              <FormControl>
                <div role="group" aria-labelledby="course-description-label" className="min-w-0">
                  <RichTextEditor field={field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fileKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel id="course-thumbnail-label">Thumbnail image</FormLabel>
              <FormControl>
                <div role="group" aria-labelledby="course-thumbnail-label" className="w-full min-w-0">
                  <Uploader
                    fileTypeAccepted="image"
                    onChange={field.onChange}
                    value={field.value}
                    persistedKey={data.fileKey}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <Input
                    placeholder="e.g. 12"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={500}
                    step={1}
                    {...field}
                  />
                </FormControl>
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
                  <Input
                    placeholder="e.g. 49"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    {...field}
                  />
                </FormControl>
                <FormDescription>Whole dollars, no cents.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full sm:max-w-xs">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {courseStatus.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Only published courses are visible in the public catalog.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className="w-full sm:w-auto"
          >
            {pending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Save aria-hidden="true" />
            )}
            {pending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
