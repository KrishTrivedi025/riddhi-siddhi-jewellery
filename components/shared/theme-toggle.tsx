"use client"

import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"
import { iconSwapVariants, tapScale } from "@/lib/animations"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch — only render after mount
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-9 h-9" />

  const isDark = theme === "dark"

  const handleToggle = async () => {
    const newTheme = isDark ? "light" : "dark"
    setTheme(newTheme)

    // Sync native Android status bar color with theme
    try {
      const { StatusBar, Style } = await import("@capacitor/status-bar")
      if (newTheme === "dark") {
        await StatusBar.setStyle({ style: Style.Dark })
        await StatusBar.setBackgroundColor({ color: "#0F0F0F" })
      } else {
        await StatusBar.setStyle({ style: Style.Light })
        await StatusBar.setBackgroundColor({ color: "#FFFFFF" })
      }
    } catch {
      // Not in Capacitor — silently ignore
    }
  }

  return (
    <motion.button
      whileTap={tapScale}
      onClick={handleToggle}
      className="relative w-9 h-9 rounded-xl border border-border bg-card
                 flex items-center justify-center overflow-hidden
                 hover:border-primary/40 hover:bg-primary/5
                 transition-colors duration-200 cursor-pointer"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? "moon" : "sun"}
          variants={iconSwapVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {isDark
            ? <Moon size={15} className="text-primary" />
            : <Sun  size={15} className="text-amber-500" />
          }
        </motion.div>
      </AnimatePresence>
    </motion.button>
  )
}
