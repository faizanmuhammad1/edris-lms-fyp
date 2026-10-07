import type { PublicCourseType } from "@/app/data/course/get-all-courses";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { getCourseImage } from "@/lib/course-images";
import { BarChart, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/** Compact card for courses the student is not enrolled in yet (links to the public course page). */
export function ExploreCourseCard({ data }: { data: PublicCourseType }) {
  const constructedUrl = useConstructUrl(data.fileKey ?? "");
  const imageUrl = data.fileKey ? constructedUrl : getCourseImage(data.category, data.id);

  return (
    <Card className="group relative gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/50">
      <div className="relative aspect-video w-full bg-muted">
        <Image
          fill
          src={imageUrl}
          alt=""
          className="object-cover"
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
        />
        {data.category && (
          <Badge variant="secondary" className="absolute top-3 left-3 max-w-[calc(100%-1.5rem)] truncate">
            {data.category}
          </Badge>
        )}
      </div>
      <CardContent className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <h3 className="text-lg leading-snug font-semibold break-words">
          <Link
            href={`/courses/${data.slug}`}
            className="line-clamp-2 outline-none after:absolute after:inset-0 after:content-[''] hover:text-primary"
            title={data.title}
          >
            {data.title}
          </Link>
        </h3>
        {data.smallDescription && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{data.smallDescription}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <BarChart className="size-3.5" aria-hidden="true" />
            {data.level}
          </span>
          {data.duration > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden="true" />
              {data.duration} {data.duration === 1 ? "hour" : "hours"}
            </span>
          )}
          {data.user?.name && <span className="truncate">By {data.user.name}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
