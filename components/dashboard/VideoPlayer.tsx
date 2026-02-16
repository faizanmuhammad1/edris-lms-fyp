"use client";

import {
  useEffect,
  useRef,
  useCallback,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
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
import { BookIcon, Loader2Icon, ShieldAlertIcon } from "lucide-react";

export interface VideoPlayerHandle {
  seekTo: (seconds: number) => void;
}

interface VideoPlayerProps {
  lessonId: string;
  videoKey: string;
  thumbnailKey: string;
  startTime?: number;
  /** Whether to track and save progress (disabled for public previews) */
  trackProgress?: boolean;
  /** Mux playback ID for secure streaming (preferred over direct S3) */
  muxPlaybackId?: string | null;
  /** Callback when video finishes playing */
  onComplete?: () => void;
  /** Fires with the current playback time (seconds) on every time update */
  onCurrentTimeUpdate?: (currentTime: number) => void;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  function VideoPlayer(
    {
      lessonId,
      videoKey,
      thumbnailKey,
      startTime = 0,
      trackProgress = true,
      muxPlaybackId,
      onComplete,
      onCurrentTimeUpdate,
    },
    ref
  ) {
  const s3VideoUrl = useConstructUrl(videoKey);
  const s3ThumbnailUrl = useConstructUrl(thumbnailKey);

  // Signed URL state — fetched from server for secure Mux playback
  const [signedStreamUrl, setSignedStreamUrl] = useState<string | null>(null);
  const [signedThumbnailUrl, setSignedThumbnailUrl] = useState<string | null>(null);
  const [isLoadingSignedUrl, setIsLoadingSignedUrl] = useState(!!muxPlaybackId);
  const [signedUrlError, setSignedUrlError] = useState<string | null>(null);

  const playerRef = useRef<MediaPlayerInstance>(null);
  const lastSavedTime = useRef(0);
  const watchedDurationRef = useRef(0);
  const hasInitialized = useRef(false);
  const lastEmittedTimeRef = useRef(0);

  useImperativeHandle(ref, () => ({
    seekTo(seconds: number) {
      if (playerRef.current) {
        playerRef.current.currentTime = seconds;
      }
    },
  }));

  // Fetch signed URL from server when muxPlaybackId is available
  useEffect(() => {
    if (!muxPlaybackId) return;

    let cancelled = false;

    fetch("/api/mux/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to get signed URL");
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setSignedStreamUrl(data.streamUrl);
        setSignedThumbnailUrl(data.thumbnailUrl);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch signed URL:", err);
        setSignedUrlError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSignedUrl(false);
      });

    return () => {
      cancelled = true;
    };
  }, [muxPlaybackId, lessonId]);

  // Determine final video and thumbnail URLs
  const isHls = !!signedStreamUrl;
  const videoUrl = signedStreamUrl || s3VideoUrl;
  const thumbnailUrl = signedThumbnailUrl || s3ThumbnailUrl;

  // For HLS, use a proper source object so vidstack detects the type correctly
  const videoSrc = isHls
    ? { src: videoUrl, type: "application/x-mpegurl" as const }
    : videoUrl;

  // Save progress to server
  const persistProgress = useCallback(
    async (currentTime: number, duration: number) => {
      // Don't save progress with unreliable duration (HLS initial chunks)
      if (!trackProgress || !duration || duration <= 10) return;

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
    (detail: { currentTime: number; played: TimeRanges }) => {
      const { currentTime } = detail;

      // Throttle timestamp updates to at most once per second
      if (currentTime - lastEmittedTimeRef.current >= 1) {
        lastEmittedTimeRef.current = currentTime;
        onCurrentTimeUpdate?.(currentTime);
      }

      if (!trackProgress) return;

      watchedDurationRef.current += 0.25; // rough increment per event

      if (Math.abs(currentTime - lastSavedTime.current) >= 10) {
        lastSavedTime.current = currentTime;
        const player = playerRef.current;
        if (player) {
          persistProgress(currentTime, player.state.duration);
        }
      }
    },
    [trackProgress, persistProgress, onCurrentTimeUpdate]
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
      if (onComplete) {
        onComplete();
      }
    }
  }, [trackProgress, persistProgress, onComplete]);

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

  if (!videoKey && !muxPlaybackId) {
    return (
      <div className="aspect-video bg-muted rounded-xl flex flex-col items-center justify-center">
        <BookIcon className="size-16 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">
          This lesson does not have a video yet
        </p>
      </div>
    );
  }

  // Show loading state while fetching signed URL
  if (muxPlaybackId && isLoadingSignedUrl) {
    return (
      <div className="aspect-video bg-muted rounded-xl flex flex-col items-center justify-center">
        <Loader2Icon className="size-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground text-sm">
          Preparing secure playback…
        </p>
      </div>
    );
  }

  // Show error if signed URL fetch failed
  if (muxPlaybackId && signedUrlError) {
    return (
      <div className="aspect-video bg-muted rounded-xl flex flex-col items-center justify-center">
        <ShieldAlertIcon className="size-10 text-destructive mb-4" />
        <p className="text-muted-foreground text-sm">
          Unable to load secure video
        </p>
      </div>
    );
  }

  return (
    <MediaPlayer
      ref={playerRef}
      src={videoSrc}
      viewType="video"
      streamType="on-demand"
      preferNativeHLS={false}
      playsInline
      crossOrigin
      onTimeUpdate={handleTimeUpdate}
      onPause={handlePause}
      onEnded={handleEnded}
      onCanPlay={handleCanPlay}
      className="w-full aspect-video overflow-hidden rounded-xl bg-black shadow-lg ring-1 ring-border/10"
    >
      <MediaProvider>
        {thumbnailUrl && (
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
});
