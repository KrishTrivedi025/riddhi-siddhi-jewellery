/**
 * lib/capacitor.ts
 *
 * Utility helpers for Capacitor native app features.
 * All functions are safe to call from the browser too — they just no-op.
 *
 * How to use:
 *   import { isNativeApp, hideSplashScreen } from "@/lib/capacitor"
 */

// ─── Detection ───────────────────────────────────────────────────────────────

/**
 * Returns true when the app is running inside the Android APK (Capacitor WebView).
 * Returns false in regular browser (Vercel web app).
 */
export const isNativeApp = (): boolean => {
  if (typeof window === "undefined") return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return typeof (window as any).Capacitor !== "undefined"
}

// ─── Splash Screen ───────────────────────────────────────────────────────────

/**
 * Hide the native splash screen after the app has fully loaded.
 * Call this in your root layout or dashboard page once data is ready.
 */
export const hideSplashScreen = async (): Promise<void> => {
  if (!isNativeApp()) return
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen")
    await SplashScreen.hide({ fadeOutDuration: 300 })
  } catch {
    // Plugin not available — silently ignore
  }
}

// ─── Status Bar ──────────────────────────────────────────────────────────────

/**
 * Set the Android status bar style.
 * @param style "DARK" (white icons on dark bg) | "LIGHT" (dark icons on light bg)
 * @param color  Hex color for the status bar background
 */
export const setStatusBar = async (
  style: "DARK" | "LIGHT" = "DARK",
  color = "#0F0F0F"
): Promise<void> => {
  if (!isNativeApp()) return
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar")
    await StatusBar.setStyle({ style: style === "DARK" ? Style.Dark : Style.Light })
    await StatusBar.setBackgroundColor({ color })
  } catch {
    // Plugin not available — silently ignore
  }
}

// ─── Hardware Back Button ─────────────────────────────────────────────────────

/**
 * Register Android hardware back button handler.
 * Prevents the app from closing unexpectedly.
 *
 * Usage (call once in your root client component):
 *   useEffect(() => {
 *     const cleanup = registerBackButton(() => router.back())
 *     return cleanup
 *   }, [])
 */
export const registerBackButton = (
  onBack: () => void
): (() => void) => {
  if (!isNativeApp()) return () => {}

  let cleanup = () => {}

  ;(async () => {
    try {
      const { App } = await import("@capacitor/app")
      const handle = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) {
          onBack()
        } else {
          // On root screen — minimize app instead of closing
          App.minimizeApp()
        }
      })
      cleanup = () => handle.remove()
    } catch {
      // Plugin not available
    }
  })()

  return () => cleanup()
}

// ─── App State ────────────────────────────────────────────────────────────────

/**
 * Listen for app going to background / coming back to foreground.
 * Useful for refreshing data when user returns to the app.
 *
 * Usage:
 *   useEffect(() => {
 *     return onAppResume(() => refetchData())
 *   }, [])
 */
export const onAppResume = (callback: () => void): (() => void) => {
  if (!isNativeApp()) return () => {}

  let cleanup = () => {}

  ;(async () => {
    try {
      const { App } = await import("@capacitor/app")
      const handle = await App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) callback()
      })
      cleanup = () => handle.remove()
    } catch {
      // Plugin not available
    }
  })()

  return () => cleanup()
}
