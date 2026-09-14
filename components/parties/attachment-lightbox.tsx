"use client"

import { Dialog as DialogPrimitive } from "radix-ui"
import { X } from "lucide-react"

interface AttachmentLightboxProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    url: string
    fileName: string
    fileType: "image" | "pdf"
}

// Full-screen in-app preview — a plain <a target="_blank"> handed control to the
// OS/WebView, which has no PDF renderer (documents just failed to open) and no
// "fit to screen" framing for images (they opened at native pixel size, looking
// "zoomed in"). This renders both cases itself instead.
export function AttachmentLightbox({ open, onOpenChange, url, fileName, fileType }: AttachmentLightboxProps) {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay
                    className="fixed inset-0 z-50 bg-black/90 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
                />
                <DialogPrimitive.Content
                    data-slot="dialog-content"
                    className="fixed inset-0 z-50 flex flex-col outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
                >
                    <DialogPrimitive.Title className="sr-only">{fileName}</DialogPrimitive.Title>
                    <div
                        className="flex items-center justify-between gap-3 px-4 py-3 shrink-0"
                        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
                    >
                        <p className="text-sm text-white/90 truncate">{fileName}</p>
                        <DialogPrimitive.Close className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0">
                            <X size={20} />
                        </DialogPrimitive.Close>
                    </div>
                    <div className="flex-1 min-h-0">
                        {fileType === "image" ? (
                            <div className="w-full h-full flex items-center justify-center p-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={fileName} className="max-w-full max-h-full object-contain" />
                            </div>
                        ) : (
                            // WebViews (including this app's Capacitor shell) have no built-in
                            // PDF renderer, unlike a full browser — Google's viewer renders it
                            // as a normal web page instead, which any WebView can display.
                            <iframe
                                src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
                                className="w-full h-full border-0 bg-white"
                                title={fileName}
                            />
                        )}
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}
