import { Loader2 } from "lucide-react";

export default function LessonLoading() {
  return (
    <div className="flex items-center justify-center min-h-[200px] gap-2 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      <span>Loading...</span>
    </div>
  );
}
