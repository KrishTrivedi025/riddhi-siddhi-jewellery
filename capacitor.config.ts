import type { CapacitorConfig } from "@capacitor/cli"

/**
 * capacitor.config.ts
 *
 * HYBRID MODE: The APK loads your live Vercel URL inside a WebView.
 * This means:
 *  ✅ All server features work (Prisma, NextAuth, Supabase, PDF generation)
 *  ✅ Any update you push to Vercel is instantly live in the APK
 *  ✅ Zero code changes to your existing Next.js app
 *  ⚠️  Internet required (your app needs Supabase anyway, so this is fine)
 *
 * IMPORTANT: Replace the server.url below with your actual Vercel URL
 * after you deploy in Phase 2.
 */
const config: CapacitorConfig = {
  appId: "com.riddhisiddhi.jewellery",
  appName: "Riddhi Siddhi Jewellery",

  // ── Hybrid: load from live Vercel deployment ──────────────────────────────
  // Replace this URL with your actual Vercel deployment URL
  server: {
    url: "https://riddhi-siddhi-jewellery-dlbp.vercel.app", // ✅ Live Vercel URL
    cleartext: false,
    allowNavigation: [
      "riddhi-siddhi-jewellery-dlbp.vercel.app",
      "*.supabase.co",
    ],
  },

  // ── Android Configuration ─────────────────────────────────────────────────
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    // Allow mixed content (needed for some Supabase image URLs)
    allowMixedContent: false,
    // Capture input from hardware keyboard
    captureInput: true,
    // WebContentsDebuggingEnabled for development (set false for release)
    webContentsDebuggingEnabled: false,
  },

  // ── Plugin Configuration ──────────────────────────────────────────────────
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,        // Show for 2 seconds then auto-hide
      launchAutoHide: true,            // Auto-hide — no manual call needed
      backgroundColor: "#0F0F0F",
      androidSplashResourceName: "splash",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },

    StatusBar: {
      style: "DARK",                   // White icons on dark background
      backgroundColor: "#0F0F0F",
      overlaysWebView: false,
    },

    Keyboard: {
      resize: "body",                  // Resize body when keyboard opens (not native)
      style: "dark",
      resizeOnFullScreen: true,
    },
  },
}

export default config