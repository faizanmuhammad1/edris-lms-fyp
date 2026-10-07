import Image from "next/image";
import { getPublicFileUrl } from "@/lib/file-url";
import { PreviewDialogTrigger } from "./PreviewDialogTrigger";
import type { PreviewVideoSource } from "./PreviewMediaPlayer";

const PLACEHOLDER_THUMBNAIL =
    "data:image/svg+xml," +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect fill="%231e293b" width="1280" height="720"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="system-ui,sans-serif" font-size="24">No preview</text></svg>'
    );

const THUMBNAIL_SIZES = "(min-width: 1280px) 820px, (min-width: 1024px) 60vw, 100vw";

interface VideoPreviewPlayerProps {
    thumbnailKey: string | null;
    videoKey: string | null;
    title: string;
    muxStreamUrl?: string | null;
    muxThumbnailUrl?: string | null;
}

/**
 * Course preview: the thumbnail (the page's LCP image) is server-rendered; only a small
 * client trigger is hydrated, and the video player itself loads when the preview opens.
 */
export function VideoPreviewPlayer({
    thumbnailKey,
    videoKey,
    title,
    muxStreamUrl,
    muxThumbnailUrl,
}: VideoPreviewPlayerProps) {
    const s3ThumbnailUrl =
        thumbnailKey != null && thumbnailKey !== "" ? getPublicFileUrl(thumbnailKey) : null;
    const s3VideoUrl = videoKey ? getPublicFileUrl(videoKey) : null;

    const thumbnailUrl = muxThumbnailUrl || s3ThumbnailUrl || PLACEHOLDER_THUMBNAIL;
    const videoUrl = muxStreamUrl || s3VideoUrl;

    // For HLS, the player needs a typed source object.
    const videoSrc: PreviewVideoSource | null = muxStreamUrl
        ? { src: muxStreamUrl, type: "application/x-mpegurl" }
        : videoUrl;

    const thumbnail = (
        <Image
            src={thumbnailUrl}
            alt={videoSrc ? "" : `${title} course thumbnail`}
            fill
            sizes={THUMBNAIL_SIZES}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            priority
            unoptimized={thumbnailUrl.startsWith("data:")}
        />
    );

    if (!videoSrc) {
        return <div className="relative aspect-video w-full overflow-hidden bg-muted">{thumbnail}</div>;
    }

    return (
        <PreviewDialogTrigger videoSrc={videoSrc} posterUrl={thumbnailUrl} title={title}>
            {thumbnail}
        </PreviewDialogTrigger>
    );
}
