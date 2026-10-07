"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Accept, FileRejection, useDropzone } from "react-dropzone";
import { Card, CardContent } from "../ui/card";
import { cn } from "@/lib/utils";
import {
  RenderEmptyState,
  RenderErrorState,
  RenderUploadedState,
  RenderUploadingState,
} from "./RenderState";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useConstructUrl } from "@/hooks/use-construct-url";

const DOCUMENT_ACCEPT = {
  "application/pdf": [".pdf"],
  "application/x-pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/zip": [".zip"],
  "application/x-zip-compressed": [".zip"],
  "application/x-compressed": [".zip"],
  "multipart/x-zip": [".zip"],
  "application/x-rar-compressed": [".rar"],
  "application/octet-stream": [".zip", ".pdf", ".rar"],
};

const DOCUMENT_MAX_SIZE = 50 * 1024 * 1024; // 50MB

const GENERIC_UPLOAD_ERROR = "Upload failed. Please try again.";

interface UploaderState {
  id: string | null;
  file: File | null;
  uploading: boolean;
  progress: number;
  key?: string;
  isDeleting: boolean;
  error: boolean;
  errorMessage?: string;
  objectUrl?: string;
  fileType: "image" | "video" | "document";
}

interface iAppProps {
  value?: string;
  onChange?: (value: string) => void;
  fileTypeAccepted: "image" | "video" | "document";
  className?: string; // Allow custom styling
  onUploadSuccess?: (data: { key: string; name: string; size: number; type: string }) => void;
  fileName?: string;
  endpoint?: string;
  useDirectUpload?: boolean;
  /** Extra fields sent with the presigned-URL request (e.g. { assignmentId }). */
  uploadParams?: Record<string, string>;
  /** Override the dropzone accept map derived from fileTypeAccepted. */
  accept?: Accept;
  /** Override the max file size (bytes) derived from fileTypeAccepted. */
  maxSize?: number;
  /**
   * Key currently saved in the database. "Remove" never deletes this object from storage
   * (the form may not be saved); it is cleaned up server-side when a save replaces it.
   * Defaults to the initial `value`.
   */
  persistedKey?: string;
  /** Injected by shadcn <FormControl>; links the dropzone to its FormLabel/FormDescription. */
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
}

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1).replace(/\.0$/, "")} GB`;
  if (mb >= 1) return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Human-readable list of accepted types, e.g. "PDF, DOC or ZIP" or "Any image file". */
function describeAccepted(accept: Accept): string {
  const extensions = new Set<string>();
  let wildcard: string | null = null;
  for (const [mime, exts] of Object.entries(accept)) {
    if (mime.endsWith("/*")) wildcard = mime.split("/")[0];
    for (const ext of exts) extensions.add(ext.replace(/^\./, "").toUpperCase());
  }
  const list = [...extensions];
  if (list.length > 1) return `${list.slice(0, -1).join(", ")} or ${list[list.length - 1]}`;
  if (list.length === 1) return list[0];
  if (wildcard === "image") return "Any image file";
  if (wildcard === "video") return "Any video file";
  return "Any file";
}

/** Friendly message for a failed upload request (never shows raw server errors for 5xx/429). */
function responseErrorMessage(status: number, body: unknown): string {
  if (status === 429) return "Too many uploads in a short time. Please wait a minute and try again.";
  if (status === 401 || status === 403) return "You don't have permission to upload this file.";
  if (status >= 500) return GENERIC_UPLOAD_ERROR;
  const message =
    body && typeof body === "object" && "error" in body ? (body as { error?: unknown }).error : null;
  return typeof message === "string" && message.trim() ? message : GENERIC_UPLOAD_ERROR;
}

/**
 * A <label for> can't name a div, so give the matching label (e.g. a FormLabel) a known id
 * that the dropzone references with aria-labelledby. A missing label is simply ignored.
 */
function useAssociatedLabelId(controlId?: string) {
  const labelId = controlId ? `${controlId}-label` : undefined;
  useEffect(() => {
    if (!controlId || !labelId) return;
    const label = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(controlId)}"]`);
    if (label && !label.id) label.id = labelId;
  }, [controlId, labelId]);
  return labelId;
}

export function Uploader({
  onChange,
  value,
  fileTypeAccepted,
  className,
  onUploadSuccess,
  fileName,
  endpoint,
  useDirectUpload,
  uploadParams,
  accept,
  maxSize: maxSizeOverride,
  persistedKey,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: iAppProps) {
  const fileUrl = useConstructUrl(value || "");
  const initialKeyRef = useRef(value);
  const savedKey = persistedKey ?? initialKeyRef.current;
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const cancelRequestedRef = useRef(false);
  const promptId = useId();
  const helpId = useId();
  const labelId = useAssociatedLabelId(id);
  const [announcement, setAnnouncement] = useState("");
  const [fileState, setFileState] = useState<UploaderState>({
    error: false,
    file: null,
    id: null,
    uploading: false,
    progress: 0,
    isDeleting: false,
    fileType: fileTypeAccepted,
    key: value,
    objectUrl: value ? fileUrl : undefined,
  });

  const acceptConfig =
    fileTypeAccepted === "video"
      ? { "video/*": [] }
      : fileTypeAccepted === "document"
        ? DOCUMENT_ACCEPT
        : { "image/*": [] };

  const finalAcceptConfig = accept ?? (acceptConfig as Accept);

  const maxSize =
    maxSizeOverride ??
    (fileTypeAccepted === "image"
      ? 5 * 1024 * 1024
      : fileTypeAccepted === "document"
        ? DOCUMENT_MAX_SIZE
        : 5000 * 1024 * 1024);

  const acceptedLabel = describeAccepted(finalAcceptConfig);
  const helpText = `${acceptedLabel} · up to ${formatBytes(maxSize)}`;

  const resetToEmpty = useCallback(() => {
    setFileState((prev) => {
      if (prev.objectUrl && !prev.objectUrl.startsWith("http")) {
        URL.revokeObjectURL(prev.objectUrl);
      }
      return {
        file: null,
        uploading: false,
        progress: 0,
        objectUrl: undefined,
        error: false,
        fileType: fileTypeAccepted,
        id: null,
        isDeleting: false,
      };
    });
  }, [fileTypeAccepted]);

  const failUpload = useCallback((message: string) => {
    xhrRef.current = null;
    setFileState((prev) => ({
      ...prev,
      uploading: false,
      progress: 0,
      error: true,
      errorMessage: message,
    }));
    setAnnouncement(`Upload failed. ${message}`);
    toast.error(message);
  }, []);

  const completeUpload = useCallback(
    (file: File, key: string, type: string) => {
      xhrRef.current = null;
      setFileState((prev) => ({
        ...prev,
        progress: 100,
        uploading: false,
        key,
        error: false,
        errorMessage: undefined,
      }));
      onChange?.(key);
      onUploadSuccess?.({ key, name: file.name, size: file.size, type });
      setAnnouncement(`${file.name} uploaded.`);
      toast.success("File uploaded successfully");
    },
    [onChange, onUploadSuccess]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      cancelRequestedRef.current = false;
      setFileState((prev) => ({
        ...prev,
        uploading: true,
        progress: 0,
        error: false,
        errorMessage: undefined,
      }));
      setAnnouncement(`Uploading ${file.name}.`);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentageCompleted = (event.loaded / event.total) * 100;
          setFileState((prev) => ({
            ...prev,
            progress: Math.round(percentageCompleted),
          }));
        }
      };

      xhr.onerror = () => failUpload("Network error. Check your connection and try again.");

      xhr.onabort = () => {
        xhrRef.current = null;
        // Aborts also happen on unmount; only react to a cancel the user asked for.
        if (!cancelRequestedRef.current) return;
        cancelRequestedRef.current = false;
        resetToEmpty();
        setAnnouncement("Upload cancelled.");
        toast.info("Upload cancelled");
      };

      try {
        if (useDirectUpload) {
          const formData = new FormData();
          formData.append("file", file);

          xhr.onload = () => {
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText);
                completeUpload(file, response.key, file.type);
              } catch {
                failUpload(GENERIC_UPLOAD_ERROR);
              }
            } else {
              let body: unknown = null;
              try {
                body = JSON.parse(xhr.responseText);
              } catch {
                body = null;
              }
              failUpload(responseErrorMessage(xhr.status, body));
            }
          };

          xhrRef.current = xhr;
          xhr.open("POST", endpoint || "/api/s3/upload-direct");
          xhr.send(formData);
          return;
        }

        // 1. Get Presigned URL
        const presignedRes = await fetch(endpoint || "/api/s3/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...uploadParams,
            fileName: file.name,
            contentType: file.type,
            size: file.size,
            isImage: file.type.startsWith("image/"),
          }),
        });

        if (!presignedRes.ok) {
          const body = await presignedRes.json().catch(() => null);
          failUpload(responseErrorMessage(presignedRes.status, body));
          return;
        }

        const {
          presignedUrl,
          key,
          contentType: signedContentType,
        }: { presignedUrl: string; key: string; contentType?: string } =
          await presignedRes.json();
        // The server may normalise the MIME type (it is part of the signature)
        const uploadContentType = signedContentType || file.type;

        // Cancelled while the upload URL was being requested
        if (cancelRequestedRef.current) {
          cancelRequestedRef.current = false;
          resetToEmpty();
          setAnnouncement("Upload cancelled.");
          toast.info("Upload cancelled");
          return;
        }

        // 2. Upload directly to S3 via PUT
        xhr.onload = () => {
          // S3 responds with 200 OK on successful PUT
          if (xhr.status === 200) {
            completeUpload(file, key, uploadContentType);
          } else {
            failUpload(GENERIC_UPLOAD_ERROR);
          }
        };

        xhrRef.current = xhr;
        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", uploadContentType);
        xhr.send(file);
      } catch {
        failUpload("Network error. Check your connection and try again.");
      }
    },
    [useDirectUpload, endpoint, uploadParams, completeUpload, failUpload, resetToEmpty]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Replacing a file: clear the previous value first. A file uploaded earlier in this
      // session is deleted from storage; the saved one is cleaned up when the form is saved.
      const previousKey = fileState.key;
      if (previousKey) {
        if (previousKey !== savedKey) {
          void fetch("/api/s3/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: previousKey }),
          }).catch(() => {});
        }
        onChange?.("");
      }

      if (fileState.objectUrl && !fileState.objectUrl.startsWith("http")) {
        URL.revokeObjectURL(fileState.objectUrl);
      }
      setFileState({
        file: file,
        uploading: false,
        progress: 0,
        objectUrl: URL.createObjectURL(file),
        error: false,
        id: uuidv4(),
        isDeleting: false,
        fileType: fileTypeAccepted,
      });

      uploadFile(file);
    },
    [fileState.key, fileState.objectUrl, savedKey, onChange, uploadFile, fileTypeAccepted]
  );

  async function handleRemoveFile() {
    if (fileState.isDeleting || !fileState.objectUrl) return;

    try {
      setFileState((prev) => ({
        ...prev,
        isDeleting: true,
      }));

      // Only delete objects uploaded during this editing session. The saved key stays
      // in storage until the form is saved (the save action deletes the replaced key),
      // so leaving without saving never leaves the record pointing at a deleted file.
      const uploadedThisSession = !!fileState.key && fileState.key !== savedKey;

      if (uploadedThisSession) {
        const response = await fetch("/api/s3/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: fileState.key,
          }),
        });

        if (!response.ok) {
          toast.error("We couldn't remove the file. Please try again.");
          setFileState((prev) => ({ ...prev, isDeleting: false }));
          return;
        }
      }

      onChange?.("");
      resetToEmpty();
      setAnnouncement("File removed.");
      toast.success("File removed successfully");
    } catch {
      toast.error("We couldn't remove the file. Please try again.");
      setFileState((prev) => ({ ...prev, isDeleting: false }));
    }
  }

  function rejectedFiles(fileRejection: FileRejection[]) {
    if (!fileRejection.length) return;

    const codes = fileRejection.map((rejection) => rejection.errors[0]?.code);
    let message: string | null = null;

    if (codes.includes("too-many-files")) {
      message = "Please choose one file at a time.";
    } else if (codes.includes("file-too-large")) {
      message = `This file is too large. The maximum size is ${formatBytes(maxSize)}.`;
    } else if (codes.includes("file-invalid-type")) {
      message = `This file type isn't supported. Accepted: ${acceptedLabel}.`;
    }

    if (message) {
      setAnnouncement(message);
      toast.error(message);
    }
  }

  function handleRetry() {
    if (fileState.file) {
      uploadFile(fileState.file);
    } else {
      resetToEmpty();
    }
  }

  function handleCancelUpload() {
    cancelRequestedRef.current = true;
    xhrRef.current?.abort();
  }

  // Abort an in-flight upload when the uploader unmounts (navigating away mid-upload).
  useEffect(() => {
    return () => {
      const xhr = xhrRef.current;
      xhr?.abort();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (fileState.objectUrl && !fileState.objectUrl.startsWith("http")) {
        URL.revokeObjectURL(fileState.objectUrl);
      }
    };
  }, [fileState.objectUrl]);

  const hasFile = !!fileState.objectUrl && !fileState.error && !fileState.uploading;
  const isEmpty = !fileState.objectUrl && !fileState.error && !fileState.uploading;

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: finalAcceptConfig,
    maxFiles: 1,
    multiple: false,
    maxSize,
    onDropRejected: rejectedFiles,
    disabled: fileState.uploading || fileState.isDeleting,
    // With a file shown, the dropzone only opens through the Replace button.
    noClick: hasFile || fileState.error,
    noKeyboard: hasFile || fileState.error,
    noDrag: hasFile,
  });

  function renderContent() {
    if (fileState.uploading && fileState.file) {
      return (
        <RenderUploadingState
          file={fileState.file}
          progress={fileState.progress}
          onCancel={handleCancelUpload}
        />
      );
    }

    if (fileState.error) {
      return (
        <RenderErrorState
          message={fileState.errorMessage}
          onRetry={fileState.file ? handleRetry : undefined}
          onChooseAnother={open}
        />
      );
    }

    if (fileState.objectUrl) {
      return (
        <RenderUploadedState
          handleRemoveFile={handleRemoveFile}
          onReplace={open}
          previewUrl={fileState.objectUrl}
          isDeleting={fileState.isDeleting}
          fileType={fileState.fileType}
          fileName={fileState.file?.name || fileName}
        />
      );
    }

    return (
      <RenderEmptyState
        isDragActive={isDragActive}
        fileType={fileTypeAccepted}
        helpText={helpText}
        promptId={promptId}
        helpId={helpId}
      />
    );
  }

  const invalid = ariaInvalid === true || ariaInvalid === "true";

  return (
    <div className="w-full min-w-0">
      <Card
        {...getRootProps({
          id,
          role: isEmpty ? "button" : undefined,
          "aria-labelledby": isEmpty ? [labelId, promptId].filter(Boolean).join(" ") : undefined,
          "aria-describedby": isEmpty
            ? [helpId, ariaDescribedBy].filter(Boolean).join(" ")
            : undefined,
        })}
        className={cn(
          "relative h-64 w-full gap-0 border-2 border-dashed py-0 shadow-none outline-none transition-colors duration-200 ease-in-out focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          isEmpty && "cursor-pointer hover:border-primary",
          isDragActive ? "border-solid border-primary bg-primary/10" : "border-border",
          invalid && !isDragActive && "border-destructive",
          className
        )}
      >
        <CardContent className="flex h-full w-full items-center justify-center p-4">
          <input {...getInputProps({ "aria-hidden": true })} />
          {renderContent()}
        </CardContent>
      </Card>
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
