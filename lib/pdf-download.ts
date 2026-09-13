import { format } from "date-fns"

// Filenames can't contain "/" (or other path separators) — strip a trailing one and collapse
// anything else non-alphanumeric into "_" so a prefix like "RS/" or "RS/306" stays readable.
export function sanitizeForFilename(value: string): string {
    return value.replace(/[\\/]+$/, "").replace(/[^a-zA-Z0-9-]+/g, "_")
}

// Shared "PartyName_Prefix_DD-MM-YYYY.pdf" naming convention for every party/invoice PDF that
// gets downloaded or shared (ledger statements, tax invoices, estimates).
export function buildShareFilename(partyName: string, prefix: string): string {
    return `${sanitizeForFilename(partyName.replace(/\s+/g, "_"))}_${sanitizeForFilename(prefix)}_${format(new Date(), "dd-MM-yyyy")}.pdf`
}

/**
 * Download or share a PDF blob.
 * 1. Capacitor native (Filesystem + Share) — works in APK
 * 2. Web Share API — works in mobile browsers
 * 3. Anchor click — works on desktop browsers
 */
export async function downloadOrSharePdf(blob: Blob, filename: string) {
    // 1. Try Capacitor native path (APK)
    try {
        const { Filesystem, Directory } = await import("@capacitor/filesystem")
        const { Share } = await import("@capacitor/share")
        const { Capacitor } = await import("@capacitor/core")

        if (!Capacitor.isNativePlatform()) throw new Error("not native")

        const base64 = await blobToBase64(blob)

        // Write into a fresh, per-share subfolder so re-sharing the same party/invoice on the
        // same day never reuses a path WhatsApp/Android has already indexed (that's what caused
        // shared PDFs to show a generic icon instead of a page-1 thumbnail: the same flat path
        // getting overwritten repeatedly). The visible/attached filename stays clean regardless —
        // FileProvider reports a file's display name as just its base name (`file.getName()`),
        // never the folder it's nested in, so the subfolder never leaks into what the recipient sees.
        const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_")
        const uniquePath = `share_${Date.now()}/${safeName}`

        const saved = await Filesystem.writeFile({
            path: uniquePath,
            data: base64,
            directory: Directory.Cache,
            recursive: true,
        })

        // Convert file:// URI to Capacitor-compatible URL for sharing
        const shareUri = Capacitor.convertFileSrc(saved.uri)

        const canShare = await Share.canShare()
        if (canShare.value) {
            await Share.share({
                title: filename,
                url: saved.uri,  // native URI for share sheet
                dialogTitle: "Share Invoice PDF",
            })
        } else {
            // Fallback: just open the file
            window.open(shareUri, "_blank")
        }
        return
    } catch {
        // Not in Capacitor or plugins unavailable — fall through
    }

    // 2. Try Web Share API (mobile browsers)
    if (typeof navigator !== "undefined" && navigator.share) {
        try {
            const file = new File([blob], filename, { type: "application/pdf" })
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: filename })
                return
            }
        } catch {
            // Cancelled or unsupported — fall through
        }
    }

    // 3. Fallback: anchor click (desktop / web)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 5000)
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            const result = reader.result as string
            // Strip data URL prefix — Capacitor Filesystem expects raw base64
            resolve(result.split(",")[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}
