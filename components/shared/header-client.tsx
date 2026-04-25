"use client"

import { motion } from "framer-motion"
import { LogOut } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { LanguageToggle } from "./language-toggle"
import { headerVariants, tapScale } from "@/lib/animations"

interface HeaderClientProps {
  email: string
  signOutAction: () => Promise<void>
}

export function HeaderClient({ email, signOutAction }: HeaderClientProps) {
  return (
    <motion.header
      variants={headerVariants}
      initial="initial"
      animate="animate"
      className="h-14 bg-card border-b border-border
                 flex items-center justify-between px-6 shrink-0"
    >
      {/* Left — page breadcrumb placeholder (future use) */}
      <div />

      {/* Right — controls */}
      <div className="flex items-center gap-3">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </motion.header>
  )
}
