"use client";

import { TeacherCourseType } from "@/app/data/teacher/get-teacher-courses";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useConstructUrl } from "@/hooks/use-construct-url";
import {
  ArrowRight,
  Eye,
  MoreVertical,
  Pencil,
  School,
  TimerIcon,
  Trash2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface iAppProps {
  data: TeacherCourseType;
}

export function TeacherCourseCard({ data }: iAppProps) {
  const [isHovered, setIsHovered] = useState(false);
  const thumbnailUrl = useConstructUrl(data.fileKey);
  
  return (
    <Card 
      className="group relative py-0 gap-0 overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 hover:border-primary/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/3 group-hover:to-primary/5 transition-all duration-500 z-0" />
      
      {/* Enhanced dropdown */}
      <div className="absolute top-3 right-3 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="secondary" 
              size="icon"
              className="bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background hover:scale-110 transition-all duration-300 shadow-lg"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-sm border-border/50">
            <DropdownMenuItem asChild>
              <Link href={`/teacher/courses/${data.id}/edit`} className="cursor-pointer">
                <Pencil className="size-4 mr-2" />
                Edit Course
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/courses/${data.slug}`} className="cursor-pointer">
                <Eye className="size-4 mr-2" />
                Preview
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/teacher/courses/${data.id}/delete`} className="cursor-pointer text-destructive focus:text-destructive">
                <Trash2 className="size-4 mr-2" />
                Delete Course
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Image with overlay effect */}
      <div className="relative overflow-hidden rounded-t-lg">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <Image
          src={thumbnailUrl}
          alt={data.title}
          width={600}
          height={400}
          className="w-full aspect-video object-cover group-hover:scale-110 transition-transform duration-700"
        />
        {/* Status badge on image */}
        <div className="absolute top-3 left-3 z-20">
          <Badge 
            variant={data.status === "Published" ? "default" : "secondary"}
            className="backdrop-blur-sm bg-background/80 border border-border/50 shadow-lg"
          >
            {data.status === "Published" && <Sparkles className="w-3 h-3 mr-1" />}
            {data.status}
          </Badge>
        </div>
      </div>

      <CardContent className="p-5 relative z-10">
        <Link
          href={`/teacher/courses/${data.id}/edit`}
          className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors duration-300 block mb-2"
        >
          {data.title}
        </Link>

        <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed mb-4">
          {data.smallDescription}
        </p>

        {/* Enhanced metadata */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2 group/item">
            <div className="p-1.5 bg-primary/10 rounded-md group-hover/item:bg-primary/20 transition-colors">
              <TimerIcon className="size-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">{data.duration}h</span>
          </div>
          <div className="flex items-center gap-2 group/item">
            <div className="p-1.5 bg-blue-500/10 rounded-md group-hover/item:bg-blue-500/20 transition-colors">
              <School className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm text-muted-foreground">{data.level}</span>
          </div>
          <div className="flex items-center gap-2 group/item ml-auto">
            <div className="p-1.5 bg-green-500/10 rounded-md group-hover/item:bg-green-500/20 transition-colors">
              <TrendingUp className="size-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-semibold text-foreground">${data.price}</span>
          </div>
        </div>

        {/* Enhanced CTA Button */}
        <Link
          href={`/teacher/courses/${data.id}/edit`}
          className={buttonVariants({
            className: "w-full group/btn relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300",
          })}
        >
          <span className="relative z-10 flex items-center justify-center">
            Edit Course
            <ArrowRight className="ml-2 size-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
        </Link>
      </CardContent>
    </Card>
  );
}

export function TeacherCourseCardSkeleton() {
  return (
    <Card className="group relative py-0 gap-0 overflow-hidden">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="size-8 rounded-md" />
      </div>
      <div className="w-full relative h-fit">
        <Skeleton className="w-full rounded-t-lg aspect-video h-[250px] object-cover" />
      </div>
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2 rounded" />
        <Skeleton className="h-4 w-full mb-4 rounded" />
        <div className="mt-4 flex items-center gap-x-5">
          <div className="flex items-center gap-x-2">
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="h-4 w-10 rounded" />
          </div>
          <div className="flex items-center gap-x-2">
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="h-4 w-10 rounded" />
          </div>
        </div>
        <Skeleton className="mt-4 h-10 w-full rounded" />
      </CardContent>
    </Card>
  );
}
