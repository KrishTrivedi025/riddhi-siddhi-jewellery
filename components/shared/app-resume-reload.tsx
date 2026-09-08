"use client"

import { useEffect, useRef } from "react"
import { onAppResume } from "@/lib/capacitor"
import { useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes"

// Android's WebView (and a backgrounded browser tab) can suspend or drop
// in-flight requests while the app is away — on return, buttons/forms can be
// permanently stuck since the dead fetch never resolves. A hard reload is the
// only thing guaranteed to un-stick it, so force one after a long enough
// absence — but never while the user has unsaved form data.
const STALE_AFTER_MS = 2 * 60 * 1000

export function AppResumeReload() {
    const hiddenAtRef = useRef<number | null>(null)
    const { isDirty } = useUnsavedChanges()

    useEffect(() => {
        const maybeReload = () => {
            const hiddenAt = hiddenAtRef.current
            hiddenAtRef.current = null
            if (hiddenAt && Date.now() - hiddenAt > STALE_AFTER_MS && !isDirty()) {
                window.location.reload()
            }
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                hiddenAtRef.current = Date.now()
            } else {
                maybeReload()
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)
        // Capacitor's native background/foreground event — a second signal in
        // case the WebView doesn't reliably fire visibilitychange on its own.
        const removeResumeListener = onAppResume(maybeReload)

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange)
            removeResumeListener()
        }
    }, [isDirty])

    return null
}
