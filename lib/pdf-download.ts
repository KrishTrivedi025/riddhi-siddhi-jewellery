/**
 * Download or share a PDF blob.
 * Uses Web Share API (works in Capacitor WebView + mobile browsers)
 * with fallback to classic anchor-click download (desktop).
 */
export async function downloadOrSharePdf(blob: Blob, filename: string) {
    // Try Web Share API first (works in Capacitor WebView + mobile browsers)
    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
        try {
            const file = new File([blob], filename, { type: "application/pdf" })
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: filename })
                return
            }
        } catch {
            // User cancelled or share failed — fall through to download
        }
    }
    // Fallback: open blob URL in new tab — works in Capacitor WebView + desktop
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
    // Revoke after delay — new tab needs time to load the blob
    setTimeout(() => URL.revokeObjectURL(url), 30000)
}
