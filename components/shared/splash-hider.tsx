"use client"

import { useEffect } from "react"
import { hideSplashScreen } from "@/lib/capacitor"

/**
 * Hides the native splash screen once the first client render has
 * happened. Paired with `launchAutoHide: false` in capacitor.config.ts so
 * the splash stays up (instead of a fixed 2s timer) until real content is
 * ready to paint — avoids a blank WebView flash on slow connections.
 */
export function SplashHider() {
    useEffect(() => {
        hideSplashScreen()
    }, [])

    return null
}
