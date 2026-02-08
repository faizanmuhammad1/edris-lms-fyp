"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  type MediaPlayerInstance,
} from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { saveVideoProgress } from "@/app/dashboard/[slug]/[lessonId]/actions";
import { BookIcon } from "lucide-react";

interface VideoPlayerProps {
  lessonId: string;
  videoKey: string;
  thumbnailKey: string;
  startTime?: number;
  /** Whether to track and save progress (disabled for public previews) */
  trackProgress?: boolean;
}

export function VideoPlayer({
  lessonId,
  videoKey,
  thumbnailKey,
  startTime = 0,
  trackProgress = true,
}: VideoPlayerProps) {
  const videoUrl = useConstructUrl(videoKey);
  const thumbnailUrl = useConstructUrl(thumbnailKey);
  const playerRef = useRef<MediaPlayerInstance>(null);
  const lastSavedTime = useRef(0);
  const watchedDurationRef = useRef(0);
  const hasInitialized = useRef(false);

  // Save progress to server
  const persistProgress = useCallback(
    async (currentTime: number, duration: number) => {
      if (!trackProgress || !duration || duration <= 0) return;

      const percentage = Math.min((currentTime / duration) * 100, 100);

      try {
        await saveVideoProgress(lessonId, {
          lastWatchedPosition: currentTime,
          watchedDuration: watchedDurationRef.current,
          videoDuration: duration,
          watchPercentage: Math.round(percentage * 100) / 100,
        });
      } catch (error) {
        console.error("Failed to save video progress:", error);
      }
    },
    [lessonId, trackProgress]
  );

  // Debounced save on time update (every ~10 seconds of playback)
  const handleTimeUpdate = useCallback(
    (detail: { currentTime: number; played: number }) => {
      if (!trackProgress) return;

      const { currentTime } = detail;
      watchedDurationRef.current += 0.25; // rough increment per event

      if (Math.abs(currentTime - lastSavedTime.current) >= 10) {
        lastSavedTime.current = currentTime;
        const player = playerRef.current;
        if (player) {
          persistProgress(currentTime, player.state.duration);
        }
      }
    },
    [trackProgress, persistProgress]
  );

  // Save on pause
  const handlePause = useCallback(() => {
    if (!trackProgress) return;
    const player = playerRef.current;
    if (player) {
      persistProgress(player.state.currentTime, player.state.duration);
    }
  }, [trackProgress, persistProgress]);

  // Save on video end
  const handleEnded = useCallback(() => {
    if (!trackProgress) return;
    const player = playerRef.current;
    if (player) {
      persistProgress(player.state.duration, player.state.duration);
    }
  }, [trackProgress, persistProgress]);

  // Seek to last position on first load
  const handleCanPlay = useCallback(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (startTime > 0 && playerRef.current) {
      // Small delay to ensure player is ready
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.currentTime = startTime;
        }
      }, 100);
    }
  }, [startTime]);

  // Save on page unload
  useEffect(() => {
    if (!trackProgress) return;

    const handleBeforeUnload = () => {
      const player = playerRef.current;
      if (player && player.state.duration > 0) {
        // Use sendBeacon for reliability during unload
        const data = JSON.stringify({
          lessonId,
          lastWatchedPosition: player.state.currentTime,
          watchedDuration: watchedDurationRef.current,
          videoDuration: player.state.duration,
          watchPercentage:
            Math.round(
              (player.state.currentTime / player.state.duration) * 10000
            ) / 100,
        });
        navigator.sendBeacon?.("/api/video-progress", data);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Also save on component unmount
      handleBeforeUnload();
    };
  }, [trackProgress, lessonId]);

  if (!videoKey) {
    return (
      <div className="aspect-video bg-muted rounded-xl flex flex-col items-center justify-center">
        <BookIcon className="size-16 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">
          This lesson does not have a video yet
        </p>
      </div>
    );
  }

  return (
    <MediaPlayer
      ref={playerRef}
      src={videoUrl}
      viewType="video"
      streamType="on-demand"
      crossOrigin
      playsInline
      onTimeUpdate={handleTimeUpdate}
      onPause={handlePause}
      onEnded={handleEnded}
      onCanPlay={handleCanPlay}
      className="w-full aspect-video overflow-hidden rounded-xl bg-black shadow-lg ring-1 ring-border/10"
    >
      <MediaProvider>
        {thumbnailKey && (
          <Poster
            className="absolute inset-0 block h-full w-full rounded-xl object-cover opacity-0 transition-opacity data-[visible]:opacity-100"
            src={thumbnailUrl}
            alt="Video thumbnail"
          />
        )}
      </MediaProvider>

      <DefaultVideoLayout
        icons={defaultLayoutIcons}
        playbackRates={{ min: 0.25, max: 2, step: 0.25 }}
        seekStep={10}
      />
    </MediaPlayer>
  );
}
