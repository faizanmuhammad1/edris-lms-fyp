"use client";

import { useCallback, useEffect, useState } from "react";
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

interface UploaderState {
  id: string | null;
  file: File | null;
  uploading: boolean;
  progress: number;
  key?: string;
  isDeleting: boolean;
  error: boolean;
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
}

export function Uploader({ onChange, value, fileTypeAccepted, className, onUploadSuccess, fileName }: iAppProps) {
  const fileUrl = useConstructUrl(value || "");
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

  const uploadFile = useCallback(
    async (file: File) => {
      setFileState((prev) => ({
        ...prev,
        uploading: true,
        progress: 0,
      }));

      try {
        const formData = new FormData();
        formData.append("file", file);

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

        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              const { key } = response;

              // Keep the objectUrl from the file (blob URL) for preview
              setFileState((prev) => ({
                ...prev,
                progress: 100,
                uploading: false,
                key: key,
                error: false,
              }));

              onChange?.(key);
              onUploadSuccess?.({
                key,
                name: file.name,
                size: file.size,
                type: file.type,
              });
              toast.success("File uploaded successfully");
            } catch (parseError) {
              console.error("Failed to parse response:", parseError);
              setFileState((prev) => ({
                ...prev,
                uploading: false,
                progress: 0,
                error: true,
              }));
              toast.error("Something went wrong");
            }
          } else {
            setFileState((prev) => ({
              ...prev,
              uploading: false,
              progress: 0,
              error: true,
            }));

            try {
              const errorResponse = JSON.parse(xhr.responseText);
              toast.error(errorResponse.error || "Upload failed");
            } catch {
              toast.error("Upload failed");
            }
          }
        };

        xhr.onerror = () => {
          setFileState((prev) => ({
            ...prev,
            uploading: false,
            progress: 0,
            error: true,
          }));
          toast.error("Network error. Please try again");
        };

        xhr.onabort = () => {
          setFileState((prev) => ({
            ...prev,
            uploading: false,
            progress: 0,
            error: true,
          }));
          toast.error("Upload cancelled");
        };

        xhr.open("POST", "/api/s3/upload-direct");
        xhr.send(formData);
      } catch (error) {
        console.error("Upload error:", error);
        setFileState((prev) => ({
          ...prev,
          uploading: false,
          progress: 0,
          error: true,
        }));
        toast.error("Something went wrong");
      }
    },
    [onChange, onUploadSuccess]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

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
      }
    },
    [fileState.objectUrl, uploadFile, fileTypeAccepted]
  );

  async function handleRemoveFile() {
    if (fileState.isDeleting || !fileState.objectUrl) return;

    try {
      setFileState((prev) => ({
        ...prev,
        isDeleting: true,
      }));

      const response = await fetch("/api/s3/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: fileState.key,
        }),
      });

      if (!response.ok) {
        toast.error("Failed to remove file from storage");

        setFileState((prev) => ({
          ...prev,
          isDeleting: true,
          error: true,
        }));

        return;
      }

      if (fileState.objectUrl && !fileState.objectUrl.startsWith("http")) {
        URL.revokeObjectURL(fileState.objectUrl);
      }

      onChange?.("");

      setFileState(() => ({
        file: null,
        uploading: false,
        progress: 0,
        objectUrl: undefined,
        error: false,
        fileType: fileTypeAccepted,
        id: null,
        isDeleting: false,
      }));

      toast.success("File removed successfully");
    } catch {
      toast.error("Error removing file. please try again");

      setFileState((prev) => ({
        ...prev,
        isDeleting: false,
        error: true,
      }));
    }
  }

  function rejectedFiles(fileRejection: FileRejection[]) {
    if (fileRejection.length) {
      const tooManyFiles = fileRejection.find(
        (rejection) => rejection.errors[0].code === "too-many-files"
      );

      const fileSizeToBig = fileRejection.find(
        (rejection) => rejection.errors[0].code === "file-too-large"
      );

      if (fileSizeToBig) {
        toast.error("File Size exceeds the limit");
      }

      if (tooManyFiles) {
        toast.error("Too many files selected, max is 1");
      }
    }
  }

  function handleRetry() {
    setFileState((prev) => ({
      ...prev,
      error: false,
      uploading: false,
      progress: 0,
    }));
  }

  function renderContent() {
    if (fileState.uploading) {
      return (
        <RenderUploadingState
          file={fileState.file as File}
          progress={fileState.progress}
        />
      );
    }

    if (fileState.error) {
      return <RenderErrorState onRetry={handleRetry} />;
    }

    if (fileState.objectUrl) {
      return (
        <RenderUploadedState
          handleRemoveFile={handleRemoveFile}
          previewUrl={fileState.objectUrl}
          isDeleting={fileState.isDeleting}
          fileType={fileState.fileType}
          fileName={fileState.file?.name || fileName}
        />
      );
    }

    return <RenderEmptyState isDragActive={isDragActive} />;
  }

  useEffect(() => {
    return () => {
      if (fileState.objectUrl && !fileState.objectUrl.startsWith("http")) {
        URL.revokeObjectURL(fileState.objectUrl);
      }
    };
  }, [fileState.objectUrl]);

  const acceptConfig =
    fileTypeAccepted === "video"
      ? { "video/*": [] }
      : fileTypeAccepted === "document"
        ? DOCUMENT_ACCEPT
        : { "image/*": [] };

  const finalAcceptConfig = acceptConfig as Accept;

  const maxSize =
    fileTypeAccepted === "image"
      ? 5 * 1024 * 1024
      : fileTypeAccepted === "document"
        ? DOCUMENT_MAX_SIZE
        : 5000 * 1024 * 1024;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: finalAcceptConfig,
    maxFiles: 1,
    multiple: false,
    maxSize,
    onDropRejected: rejectedFiles,
    disabled: fileState.uploading || (!!fileState.objectUrl && !fileState.error),
  });
  return (
    <Card
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed transition-colors duration-200 ease-in-out w-full h-64",
        isDragActive
          ? "border-primary bg-primary/10 border-solid"
          : "border-border hover:border-primary",
        className
      )}
    >
      <CardContent className="flex items-center justify-center h-full w-full p-4">
        <input {...getInputProps()} />
        {renderContent()}
      </CardContent>
    </Card>
  );
}
