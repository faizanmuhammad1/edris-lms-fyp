import type { MouseEvent } from "react";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CloudUpload,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button, buttonVariants } from "../ui/button";
import { Progress } from "../ui/progress";
import Image from "next/image";

type FileKind = "image" | "video" | "document";

const KIND_NOUN: Record<FileKind, string> = {
  image: "image",
  video: "video",
  document: "file",
};

/** Buttons sit inside the dropzone: keep their clicks from reaching it. */
function stopAnd(fn?: () => void) {
  return (event: MouseEvent) => {
    event.stopPropagation();
    fn?.();
  };
}

export function RenderEmptyState({
  isDragActive,
  fileType = "document",
  helpText,
  promptId,
  helpId,
}: {
  isDragActive: boolean;
  fileType?: FileKind;
  helpText?: string;
  promptId?: string;
  helpId?: string;
}) {
  const noun = KIND_NOUN[fileType];
  const article = fileType === "image" ? "an" : "a";

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={cn(
          "mb-3 flex size-10 items-center justify-center rounded-full bg-muted",
          isDragActive && "bg-primary/10"
        )}
      >
        <CloudUpload
          className={cn("size-5 text-muted-foreground", isDragActive && "text-primary")}
          aria-hidden="true"
        />
      </div>
      <p id={promptId} className="text-sm font-medium text-foreground">
        {isDragActive ? (
          `Drop the ${noun} to upload it`
        ) : (
          <>
            Drag and drop {article} {noun} here, or{" "}
            <span className="text-primary underline underline-offset-4">browse</span>
          </>
        )}
      </p>
      {helpText && (
        <p id={helpId} className="mt-1 text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
      {/* Visual affordance only: the whole dropzone is the button */}
      <span
        aria-hidden="true"
        className={cn(buttonVariants({ size: "sm" }), "pointer-events-none mt-3")}
      >
        Select {noun}
      </span>
    </div>
  );
}

export function RenderErrorState({
  message,
  onRetry,
  onChooseAnother,
}: {
  message?: string;
  onRetry?: () => void;
  onChooseAnother?: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold">Upload failed</p>
      <p className="mt-1 max-w-xs break-words text-xs text-muted-foreground">
        {message || "Something went wrong. Please try again."}
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {onRetry && (
          <Button type="button" size="sm" className="h-9" onClick={stopAnd(onRetry)}>
            <RefreshCw aria-hidden="true" />
            Try again
          </Button>
        )}
        {onChooseAnother && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9"
            onClick={stopAnd(onChooseAnother)}
          >
            Choose another file
          </Button>
        )}
      </div>
    </div>
  );
}

export function RenderUploadedState({
  previewUrl,
  isDeleting,
  handleRemoveFile,
  onReplace,
  fileType,
  fileName,
}: {
  previewUrl: string;
  isDeleting: boolean;
  handleRemoveFile: () => void;
  onReplace?: () => void;
  fileType: FileKind;
  fileName?: string;
}) {
  const noun = KIND_NOUN[fileType];

  return (
    <div className="flex h-full w-full min-w-0 flex-col gap-2">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-md bg-muted/40">
        {fileType === "video" ? (
          <video
            src={previewUrl}
            controls
            className="size-full object-contain"
            aria-label={fileName ? `Preview of ${fileName}` : "Video preview"}
          />
        ) : fileType === "document" ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 p-2 text-center">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <FileText className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="w-full truncate px-2 text-sm font-medium" title={fileName}>
              {fileName ?? "Document uploaded"}
            </p>
          </div>
        ) : (
          <Image
            src={previewUrl}
            alt={fileName ? `Preview of ${fileName}` : "Uploaded image preview"}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-contain p-1"
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p
          className="min-w-0 truncate text-xs text-muted-foreground"
          title={fileType !== "document" ? fileName : undefined}
        >
          {fileType !== "document" ? fileName || `Current ${noun}` : ""}
        </p>
        <div className="flex shrink-0 gap-2">
          {onReplace && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              aria-label={`Replace ${noun}`}
              disabled={isDeleting}
              onClick={stopAnd(onReplace)}
            >
              <RefreshCw aria-hidden="true" />
              <span className="hidden sm:inline">Replace</span>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 text-destructive hover:text-destructive"
            aria-label={isDeleting ? `Removing ${noun}` : `Remove ${noun}`}
            disabled={isDeleting}
            onClick={stopAnd(handleRemoveFile)}
          >
            {isDeleting ? (
              <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{isDeleting ? "Removing..." : "Remove"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function RenderUploadingState({
  progress,
  file,
  onCancel,
}: {
  progress: number;
  file: File;
  onCancel?: () => void;
}) {
  return (
    <div className="flex w-full max-w-xs flex-col items-center text-center">
      <Loader2 className="mb-3 size-6 text-primary motion-safe:animate-spin" aria-hidden="true" />
      <p className="text-sm font-medium text-foreground">
        Uploading... <span className="tabular-nums">{progress}%</span>
      </p>
      <p className="mt-1 w-full truncate text-xs text-muted-foreground" title={file.name}>
        {file.name}
      </p>
      <Progress
        value={progress}
        className="mt-3 h-2"
        aria-label={`Uploading ${file.name}`}
      />
      {onCancel && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 h-9"
          onClick={stopAnd(onCancel)}
        >
          Cancel upload
        </Button>
      )}
    </div>
  );
}
