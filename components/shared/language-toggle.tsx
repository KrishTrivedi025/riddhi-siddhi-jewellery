"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { i18next } from "@/lib/i18n/client"
import { tapScale } from "@/lib/animations"

/**
 * Toggles between English and Hindi.
 * Persists choice to localStorage.
 */
export function LanguageToggle() {
  const [lang, setLang] = useState<"en" | "hi">("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("i18n-lang") as "en" | "hi" | null
    if (saved) {
        setLang(saved)
        if (i18next.language !== saved) {
            i18next.changeLanguage(saved)
        }
    }
  }, [])

  const toggle = () => {
    const next = lang === "en" ? "hi" : "en"
    setLang(next)
    localStorage.setItem("i18n-lang", next)
    i18next.changeLanguage(next)
  }

  if (!mounted) return <div className="w-[52px] h-9" />

  return (
    <motion.button
      whileTap={tapScale}
      onClick={toggle}
      className="relative h-9 px-3 rounded-xl border border-border bg-card
                 flex items-center gap-1.5 overflow-hidden
                 hover:border-primary/40 hover:bg-primary/5
                 transition-colors duration-200 cursor-pointer"
      aria-label={lang === "en" ? "Switch to Hindi" : "Switch to English"}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={lang}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="text-xs font-semibold text-muted-foreground"
        >
          {lang === "en" ? "हि" : "EN"}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
