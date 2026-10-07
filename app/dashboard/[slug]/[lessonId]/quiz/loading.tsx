import { Loader2 } from "lucide-react";

export default function QuizLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background p-6 text-center">
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
      <p role="status" className="text-sm text-muted-foreground">
        Preparing your quiz…
      </p>
    </div>
  );
}
