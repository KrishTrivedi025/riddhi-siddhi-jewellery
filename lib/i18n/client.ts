"use client"

import i18next from "i18next"
import { initReactI18next, useTranslation } from "react-i18next"
import resourcesToBackend from "i18next-resources-to-backend"
import { i18nConfig } from "./config"

// Initialise once — idempotent on re-renders
if (!i18next.isInitialized) {
  i18next
    .use(initReactI18next)
    .use(
      resourcesToBackend(
        (language: string, namespace: string) =>
          import(`../../locales/${language}/${namespace}.json`)
      )
    )
    .init({
      ...i18nConfig,
      lng: "en",
      detection: undefined,
    })
}

/**
 * Re-export useTranslation from this file everywhere.
 * Single import path for all components.
 *
 * Usage:
 *   const { t } = useT("nav")
 *   t("dashboard")  // → "Dashboard" | "डैशबोर्ड"
 */
export const useT = (ns?: string) => useTranslation(ns)
export { i18next }
