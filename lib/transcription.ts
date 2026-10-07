import "server-only";

import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { toFile } from "openai";
import openai from "@/lib/openai";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { S3 } from "@/lib/S3Client";
import { generateLessonSummary } from "@/lib/generate-summary";
import { Prisma } from "@/lib/generated/prisma";

/** OpenAI's upload limit for the transcription endpoint. */
const WHISPER_MAX_BYTES = 25 * 1024 * 1024;

/** File formats the transcription endpoint accepts (e.g. .mov and .mkv are not supported). */
const WHISPER_FORMATS: Record<string, string> = {
  mp4: "video/mp4",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  mpeg: "video/mpeg",
  mpga: "audio/mpeg",
  webm: "video/webm",
  wav: "audio/wav",
  ogg: "audio/ogg",
  flac: "audio/flac",
};

/** Statuses that mean we should not start another transcription job */
const TRANSCRIPTION_IN_PROGRESS = ["COMPLETED", "QUEUED", "PROCESSING"] as const;

/** A failure whose message is safe and useful to show to the teacher. */
class TranscriptionError extends Error {}

export type TranscriptionResult = { success: true } | { success: false; error: string };

/**
 * Transcribes a lesson's video with OpenAI Whisper, stores the transcript and
 * timestamped segments (used by the AI tutor), then regenerates the lesson summary.
 * Callers must authorize the user first. Never throws.
 */
export async function transcribeLessonVideo(lessonId: string): Promise<TranscriptionResult> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { videoKey: true },
  });
  const videoKey = lesson?.videoKey?.trim();
  if (!videoKey) {
    return { success: false, error: "This lesson has no video to transcribe." };
  }

  await prisma.lesson.update({
    where: { id: lessonId },
    data: { transcriptionStatus: "PROCESSING" },
  });

  try {
    const extension = videoKey.split(".").pop()?.toLowerCase() ?? "";
    const mimeType = WHISPER_FORMATS[extension];
    if (!mimeType) {
      throw new TranscriptionError(
        `.${extension || "unknown"} videos can't be transcribed automatically. Upload an MP4 or WebM file.`
      );
    }

    const bucket = env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
    const head = await S3.send(new HeadObjectCommand({ Bucket: bucket, Key: videoKey }));
    const size = head.ContentLength ?? 0;
    if (size > WHISPER_MAX_BYTES) {
      throw new TranscriptionError(
        `This video is ${(size / 1024 / 1024).toFixed(1)} MB; automatic transcription supports files up to 25 MB.`
      );
    }

    const object = await S3.send(new GetObjectCommand({ Bucket: bucket, Key: videoKey }));
    if (!object.Body) {
      throw new Error(`Video object ${videoKey} has no body`);
    }
    const bytes = await object.Body.transformToByteArray();

    // whisper-1 is the model that returns timestamped segments (verbose_json).
    const result = await openai.audio.transcriptions.create({
      file: await toFile(bytes, `lesson.${extension}`, { type: mimeType }),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    const transcript = result.text?.trim();
    if (!transcript) {
      throw new TranscriptionError("No speech was detected in this video.");
    }

    // Skip the save if the video was replaced while it was being transcribed.
    const saved = await prisma.lesson.updateMany({
      where: { id: lessonId, videoKey },
      data: {
        transcript,
        transcriptionSegments: (result.segments ?? []) as unknown as Prisma.InputJsonValue,
        transcriptionStatus: "COMPLETED",
      },
    });
    if (saved.count === 0) {
      return { success: false, error: "The lesson video changed during transcription. Please try again." };
    }

    try {
      await generateLessonSummary(lessonId);
    } catch (err) {
      // The transcript is saved; a summary can be regenerated later.
      console.error("[Transcription] Summary generation failed for lesson", lessonId, err);
    }

    return { success: true };
  } catch (err) {
    console.error("[Transcription] Failed for lesson", lessonId, err);
    await prisma.lesson
      .updateMany({ where: { id: lessonId, videoKey }, data: { transcriptionStatus: "FAILED" } })
      .catch((updateErr) => console.error("[Transcription] Failed to mark lesson FAILED", updateErr));
    return {
      success: false,
      error: err instanceof TranscriptionError ? err.message : "Transcription failed. Please try again.",
    };
  }
}

/**
 * Transcribe a lesson after it gains a video, unless a transcript is already done or
 * running. Called in the background (after()) on lesson create/update. Never throws.
 */
export async function triggerTranscriptionForLesson(lessonId: string): Promise<void> {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { videoKey: true, transcriptionStatus: true },
    });

    if (!lesson?.videoKey?.trim()) {
      return;
    }
    if (TRANSCRIPTION_IN_PROGRESS.includes(lesson.transcriptionStatus as (typeof TRANSCRIPTION_IN_PROGRESS)[number])) {
      return;
    }

    await transcribeLessonVideo(lessonId);
  } catch (err) {
    console.error("[Transcription] Auto-trigger failed for lesson", lessonId, err);
  }
}
