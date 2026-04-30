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

        const base64 = await blobToBase64(blob)
        const saved = await Filesystem.writeFile({
            path: filename,
            data: base64,
            directory: Directory.Cache,
        })

        await Share.share({ title: filename, url: saved.uri })
        return
    } catch {
        // Not in Capacitor or plugins unavailable — fall through
    }

    // 2. Try Web Share API (mobile browsers)
    if (typeof navigator !== "undefined" && navigator.share) {
        try {
            const file = new File([blob], filename, { type: "application/pdf" })
            await navigator.share({ files: [file], title: filename })
            return
        } catch {
            // Cancelled or unsupported — fall through
        }
    }

    // 3. Fallback: anchor click (desktop)
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
