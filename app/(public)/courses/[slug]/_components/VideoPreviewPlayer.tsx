"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { env } from "@/lib/env";
import { MediaPlayer, MediaProvider, Poster } from "@vidstack/react";
import {
    DefaultVideoLayout,
    defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

interface VideoPreviewPlayerProps {
    thumbnailKey: string;
    videoKey: string | null;
    title: string;
}

export function VideoPreviewPlayer({
    thumbnailKey,
    videoKey,
    title,
}: VideoPreviewPlayerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const thumbnailUrl = `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.fly.storage.tigris.dev/${thumbnailKey}`;
    const videoUrl = videoKey
        ? `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.fly.storage.tigris.dev/${videoKey}`
        : null;

    return (
        <>
            <div
                className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-2xl cursor-pointer group"
                onClick={() => videoUrl && setIsOpen(true)}
            >
                <Image
                    src={thumbnailUrl}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Play button */}
                {videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                            {/* Pulse animation ring */}
                            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
                            <Button
                                size="lg"
                                className="relative h-20 w-20 rounded-full bg-white/90 hover:bg-white text-primary shadow-2xl backdrop-blur-sm transition-all duration-300 group-hover:scale-110"
                            >
                                <Play className="h-10 w-10 fill-current ml-1" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Preview text */}
                {videoUrl && (
                    <div className="absolute bottom-6 left-6 right-6">
                        <p className="text-white/90 font-medium text-lg">Preview this course</p>
                        <p className="text-white/60 text-sm mt-1">Click to watch free preview</p>
                    </div>
                )}
            </div>

            {/* Video Modal */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-5xl p-0 bg-black border-none overflow-hidden">
                    <DialogTitle className="sr-only">Course Preview: {title}</DialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                    {videoUrl && isOpen && (
                        <div className="aspect-video w-full">
                            <MediaPlayer
                                src={videoUrl}
                                viewType="video"
                                streamType="on-demand"
                                autoPlay
                                crossOrigin
                                playsInline
                                className="w-full h-full"
                            >
                                <MediaProvider>
                                    <Poster
                                        className="absolute inset-0 block h-full w-full object-cover opacity-0 transition-opacity data-[visible]:opacity-100"
                                        src={thumbnailUrl}
                                        alt={`Preview: ${title}`}
                                    />
                                </MediaProvider>
                                <DefaultVideoLayout
                                    icons={defaultLayoutIcons}
                                    playbackRates={{ min: 0.5, max: 2, step: 0.25 }}
                                    seekStep={10}
                                />
                            </MediaPlayer>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
