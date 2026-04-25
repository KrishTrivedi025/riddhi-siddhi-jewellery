import i18next from "i18next"
import resourcesToBackend from "i18next-resources-to-backend"

/**
 * i18next configuration.
 * Uses dynamic imports so locale JSON is code-split and lazy-loaded.
 * Only runs client-side (called from i18n/client.ts).
 */
const i18nConfig = {
  supportedLngs: ["en", "hi"] as const,
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common", "nav", "dashboard", "inventory", "sales", "purchases", "parties", "payments", "expenses", "reports"],
  interpolation: {
    escapeValue: false, // React already escapes
  },
}

export type SupportedLocale = "en" | "hi"

export { i18nConfig }
export default i18nConfig
