"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Loader2, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { PreviewVideoSource } from "./PreviewMediaPlayer";

// The video player (vidstack + HLS) is only downloaded when someone opens the preview.
const PreviewMediaPlayer = dynamic(() => import("./PreviewMediaPlayer"), {
    ssr: false,
    loading: () => (
        <div className="flex h-full w-full items-center justify-center text-white/80" role="status">
            <Loader2 className="size-8 animate-spin" aria-hidden="true" />
            <span className="sr-only">Loading video player…</span>
        </div>
    ),
});

interface PreviewDialogTriggerProps {
    /** Server-rendered thumbnail shown inside the trigger. */
    children: ReactNode;
    videoSrc: PreviewVideoSource;
    posterUrl: string;
    title: string;
}

export function PreviewDialogTrigger({ children, videoSrc, posterUrl, title }: PreviewDialogTriggerProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Warm the player chunk on hover/focus so it is usually ready by the time the dialog opens.
    const preload = () => {
        void import("./PreviewMediaPlayer");
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                onPointerEnter={preload}
                onFocus={preload}
                aria-haspopup="dialog"
                className="group relative block aspect-video w-full overflow-hidden bg-muted text-left focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/60"
            >
                {children}
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                    <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-xl transition-transform duration-200 group-hover:scale-105 sm:size-20">
                        <Play className="ml-1 size-7 fill-current sm:size-9" />
                    </span>
                </span>
                <span className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6">
                    <span className="block text-base font-medium text-white sm:text-lg">Preview this course</span>
                    <span className="mt-0.5 block text-sm text-white/75">Watch a free preview lesson</span>
                </span>
            </button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="max-w-[calc(100%-1rem)] gap-0 overflow-hidden border-none bg-black p-0 sm:max-w-5xl"
                >
                    <DialogTitle className="sr-only">Course preview: {title}</DialogTitle>
                    <DialogDescription className="sr-only">Free preview video. Press Escape to close.</DialogDescription>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 z-50 size-10 rounded-full text-white hover:bg-white/20 hover:text-white"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close preview"
                    >
                        <X className="size-5" aria-hidden="true" />
                    </Button>
                    {isOpen && (
                        <div className="aspect-video w-full">
                            <PreviewMediaPlayer src={videoSrc} poster={posterUrl} title={title} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
