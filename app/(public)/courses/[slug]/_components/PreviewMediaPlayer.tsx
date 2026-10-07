"use client";

import { MediaPlayer, MediaProvider, Poster } from "@vidstack/react";
import {
    DefaultVideoLayout,
    defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

export type PreviewVideoSource = string | { src: string; type: "application/x-mpegurl" };

interface PreviewMediaPlayerProps {
    src: PreviewVideoSource;
    poster: string;
    title: string;
}

/** The vidstack player. Imported lazily (next/dynamic) only when the preview dialog opens. */
export default function PreviewMediaPlayer({ src, poster, title }: PreviewMediaPlayerProps) {
    return (
        <MediaPlayer
            src={src}
            viewType="video"
            streamType="on-demand"
            preferNativeHLS={false}
            autoPlay
            crossOrigin
            playsInline
            title={title}
            className="h-full w-full"
        >
            <MediaProvider>
                <Poster
                    className="absolute inset-0 block h-full w-full object-cover opacity-0 transition-opacity data-[visible]:opacity-100"
                    src={poster}
                    alt={`Preview: ${title}`}
                />
            </MediaProvider>
            <DefaultVideoLayout
                icons={defaultLayoutIcons}
                playbackRates={{ min: 0.5, max: 2, step: 0.25 }}
                seekStep={10}
            />
        </MediaPlayer>
    );
}
