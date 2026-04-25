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
    url: "https://riddhi-siddhi-jewellery-dlbp.vercel.app", // ← UPDATE THIS after Vercel deploy
    cleartext: false, // HTTPS only — no HTTP allowed
    allowNavigation: [
      "*.vercel.app",        // Allow your Vercel domain
      "*.supabase.co",       // Allow Supabase connections
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
      launchShowDuration: 2500,        // ms to show splash screen
      launchAutoHide: false,           // We hide it manually after app loads
      backgroundColor: "#0F0F0F",      // Dark Obsidian background
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
