"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, ImagePlus, X, RotateCcw, SwitchCamera, Upload, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type WidgetState = "idle" | "camera" | "preview" | "error"

interface ImageCaptureWidgetProps {
    value?: string | null
    onChange: (dataUrl: string) => void
    onClear: () => void
}

export function ImageCaptureWidget({ value, onChange, onClear }: ImageCaptureWidgetProps) {
    const [state, setState] = useState<WidgetState>(value ? "preview" : "idle")
    const [errorMsg, setErrorMsg] = useState("")
    const [isDragging, setIsDragging] = useState(false)
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
    const [cameraReady, setCameraReady] = useState(false)
    const [flashEffect, setFlashEffect] = useState(false)

    const videoRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // ── Resize & Compress ──────────────────────────────────────────────
    const processImage = useCallback((source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) => {
        const canvas = canvasRef.current || document.createElement("canvas")
        const MAX = 400
        let sw: number, sh: number

        if (source instanceof HTMLVideoElement) {
            sw = source.videoWidth
            sh = source.videoHeight
        } else if (source instanceof HTMLImageElement) {
            sw = source.naturalWidth
            sh = source.naturalHeight
        } else {
            sw = source.width
            sh = source.height
        }

        let w = sw, h = sh
        if (w > h) {
            if (w > MAX) { h *= MAX / w; w = MAX }
        } else {
            if (h > MAX) { w *= MAX / h; h = MAX }
        }

        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(source, 0, 0, w, h)
        return canvas.toDataURL("image/jpeg", 0.8)
    }, [])

    const mountedRef = useRef(true)

    // ── Camera Lifecycle ───────────────────────────────────────────────
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
            streamRef.current = null
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
        setCameraReady(false)
    }, [])

    const startCamera = useCallback(async (mode?: "environment" | "user") => {
        const useFacing = mode ?? facingMode
        setErrorMsg("")
        setCameraReady(false)
        setState("camera")

        // Clean stop of any existing stream before requesting a new one
        stopCamera()

        // Small delay to let browser release the old camera resource
        await new Promise(r => setTimeout(r, 100))

        if (!mountedRef.current) return

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: useFacing,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            })

            if (!mountedRef.current) {
                // Component unmounted while we were awaiting
                stream.getTracks().forEach(t => t.stop())
                return
            }

            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                try {
                    await videoRef.current.play()
                } catch (playErr: any) {
                    // AbortError is expected when stream is swapped mid-play — ignore it
                    if (playErr.name === "AbortError") return
                    throw playErr
                }
                if (mountedRef.current) setCameraReady(true)
            }
        } catch (err: any) {
            // Silently ignore AbortError (happens on rapid flip/cancel)
            if (err.name === "AbortError") return
            console.error("Camera error:", err)
            let msg = "Unable to access camera."
            if (err.name === "NotAllowedError") {
                msg = "Camera permission denied. Please allow camera access in your browser settings."
            } else if (err.name === "NotFoundError") {
                msg = "No camera found on this device."
            } else if (err.name === "NotReadableError") {
                msg = "Camera is already in use by another app."
            } else if (err.name === "OverconstrainedError") {
                msg = "Requested camera not available. Trying default..."
            }
            if (mountedRef.current) {
                setErrorMsg(msg)
                setState("error")
            }
        }
    }, [facingMode, stopCamera])

    // Cleanup on unmount
    useEffect(() => {
        mountedRef.current = true
        return () => {
            mountedRef.current = false
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop())
            }
        }
    }, [])

    // ── Capture ────────────────────────────────────────────────────────
    const capturePhoto = useCallback(() => {
        if (!videoRef.current) return

        // Flash effect
        setFlashEffect(true)
        setTimeout(() => setFlashEffect(false), 200)

        const dataUrl = processImage(videoRef.current)
        stopCamera()
        onChange(dataUrl)
        setState("preview")
    }, [processImage, stopCamera, onChange])

    // ── Flip Camera ────────────────────────────────────────────────────
    const flipCamera = useCallback(async () => {
        const next = facingMode === "environment" ? "user" : "environment"
        setFacingMode(next)
        // Sequentially stop → restart with new facing (no useEffect race)
        await startCamera(next)
    }, [facingMode, startCamera])

    // ── File Upload ────────────────────────────────────────────────────
    const handleFileSelect = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) return

        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                const dataUrl = processImage(img)
                onChange(dataUrl)
                setState("preview")
            }
            img.src = e.target?.result as string
        }
        reader.readAsDataURL(file)
    }, [processImage, onChange])

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFileSelect(file)
        // Reset input so same file can be selected again
        e.target.value = ""
    }, [handleFileSelect])

    // ── Drag & Drop ────────────────────────────────────────────────────
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) handleFileSelect(file)
    }, [handleFileSelect])

    // ── Retake / Remove ────────────────────────────────────────────────
    const handleRetake = useCallback(() => {
        onClear()
        startCamera()
    }, [onClear, startCamera])

    const handleRemove = useCallback(() => {
        onClear()
        setState("idle")
    }, [onClear])

    const handleCancelCamera = useCallback(() => {
        stopCamera()
        setState(value ? "preview" : "idle")
    }, [stopCamera, value])

    // ── Sync value prop with state ─────────────────────────────────────
    useEffect(() => {
        if (value && state === "idle") {
            setState("preview")
        } else if (!value && state === "preview") {
            setState("idle")
        }
    }, [value, state])

    // ── Hidden elements ────────────────────────────────────────────────
    const hiddenInputs = (
        <>
            <canvas ref={canvasRef} className="hidden" />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />
        </>
    )

    // ── IDLE STATE ─────────────────────────────────────────────────────
    if (state === "idle") {
        return (
            <div className="space-y-2">
                {hiddenInputs}
                <div
                    className={`
                        relative w-full rounded-xl border-2 border-dashed transition-all duration-300
                        ${isDragging
                            ? "border-primary bg-primary/10 scale-[1.02]"
                            : "border-border bg-background hover:border-border"
                        }
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center justify-center py-8 px-4 gap-4">
                        {/* Icon */}
                        <div className={`
                            w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300
                            ${isDragging ? "bg-primary/20 text-primary" : "bg-card text-[#606060]"}
                        `}>
                            <Upload size={24} strokeWidth={1.5} />
                        </div>

                        {/* Text */}
                        <div className="text-center">
                            <p className={`text-sm font-medium transition-colors duration-300 ${isDragging ? "text-primary" : "text-[#808080]"}`}>
                                {isDragging ? "Drop image here" : "Upload product photo"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Drag & drop or use the buttons below
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                onClick={() => startCamera()}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold gap-2 px-4 h-9 rounded-lg transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                            >
                                <Camera size={14} />
                                Take Photo
                            </Button>
                            <Button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                variant="outline"
                                className="border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-card text-xs gap-2 px-4 h-9 rounded-lg transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                            >
                                <ImagePlus size={14} />
                                Browse
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ── CAMERA STATE ───────────────────────────────────────────────────
    if (state === "camera") {
        return (
            <div className="space-y-2">
                {hiddenInputs}
                <div className="relative w-full rounded-xl overflow-hidden bg-black border border-border">
                    {/* Live viewfinder */}
                    <div className="relative aspect-[4/3] w-full">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`
                                w-full h-full object-cover transition-opacity duration-500
                                ${cameraReady ? "opacity-100" : "opacity-0"}
                            `}
                            style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
                        />

                        {/* Loading overlay */}
                        {!cameraReady && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs text-[#808080] animate-pulse">Starting camera...</p>
                            </div>
                        )}

                        {/* Flash effect */}
                        <div
                            className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-200 ${flashEffect ? "opacity-60" : "opacity-0"}`}
                        />

                        {/* Corner viewfinder marks */}
                        {cameraReady && (
                            <>
                                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary/70 rounded-tl-sm" />
                                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary/70 rounded-tr-sm" />
                                <div className="absolute bottom-16 left-4 w-6 h-6 border-b-2 border-l-2 border-primary/70 rounded-bl-sm" />
                                <div className="absolute bottom-16 right-4 w-6 h-6 border-b-2 border-r-2 border-primary/70 rounded-br-sm" />
                            </>
                        )}

                        {/* Top controls */}
                        <div className="absolute top-2 right-2 flex gap-2">
                            <button
                                type="button"
                                onClick={handleCancelCamera}
                                className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Bottom camera controls */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-3 px-4">
                            <div className="flex items-center justify-center gap-6">
                                {/* Browse file fallback */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
                                >
                                    <ImagePlus size={18} />
                                </button>

                                {/* Capture button */}
                                <button
                                    type="button"
                                    onClick={capturePhoto}
                                    disabled={!cameraReady}
                                    className={`
                                        w-16 h-16 rounded-full border-4 border-white/90 flex items-center justify-center transition-all duration-200
                                        ${cameraReady
                                            ? "bg-primary hover:bg-primary/90 hover:scale-110 active:scale-95 cursor-pointer shadow-lg shadow-primary/30"
                                            : "bg-gray-600 cursor-not-allowed opacity-50"
                                        }
                                    `}
                                >
                                    <div className="w-12 h-12 rounded-full border-2 border-white/30" />
                                </button>

                                {/* Flip camera */}
                                <button
                                    type="button"
                                    onClick={flipCamera}
                                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
                                >
                                    <SwitchCamera size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ── ERROR STATE ────────────────────────────────────────────────────
    if (state === "error") {
        return (
            <div className="space-y-2">
                {hiddenInputs}
                <div className="w-full rounded-xl border border-rose-500/30 bg-rose-500/5 p-5">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                            <XCircle size={24} className="text-rose-400" />
                        </div>
                        <p className="text-sm text-rose-300">{errorMsg}</p>
                        <div className="flex gap-3 mt-1">
                            <Button
                                type="button"
                                onClick={() => startCamera()}
                                variant="outline"
                                className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs h-8"
                            >
                                <RotateCcw size={12} className="mr-1.5" />
                                Retry Camera
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    setState("idle")
                                    fileInputRef.current?.click()
                                }}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8"
                            >
                                <ImagePlus size={12} className="mr-1.5" />
                                Browse Instead
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ── PREVIEW STATE ──────────────────────────────────────────────────
    return (
        <div className="space-y-2">
            {hiddenInputs}
            <div className="relative group">
                <div className="relative w-full rounded-xl overflow-hidden border border-border bg-background">
                    {/* Image */}
                    <div className="aspect-[4/3] w-full flex items-center justify-center bg-background">
                        <img
                            src={value as string}
                            alt="Product preview"
                            className="max-w-full max-h-full object-contain animate-in fade-in duration-300"
                        />
                    </div>

                    {/* Hover overlay with actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                        <button
                            type="button"
                            onClick={handleRetake}
                            className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/25 transition-all hover:scale-110"
                            title="Take new photo"
                        >
                            <Camera size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/25 transition-all hover:scale-110"
                            title="Upload different image"
                        >
                            <ImagePlus size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="w-10 h-10 rounded-full bg-rose-500/20 backdrop-blur-md flex items-center justify-center text-rose-300 hover:bg-rose-500/30 transition-all hover:scale-110"
                            title="Remove image"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Small badge showing it's a product photo */}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-md px-2 py-0.5 text-[10px] text-primary font-medium tracking-wide uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Product Photo
                </div>
            </div>
        </div>
    )
}
