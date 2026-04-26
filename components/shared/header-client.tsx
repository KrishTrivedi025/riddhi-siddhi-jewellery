"use client"

import { motion } from "framer-motion"
import { Menu } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { LanguageToggle } from "./language-toggle"
import { headerVariants } from "@/lib/animations"
import { useSidebar } from "@/lib/sidebar-context"

interface HeaderClientProps {
  email: string
  signOutAction: () => Promise<void>
}

export function HeaderClient({ email, signOutAction }: HeaderClientProps) {
  const { toggle } = useSidebar()

  return (
    <motion.header
      variants={headerVariants}
      initial="initial"
      animate="animate"
      className="h-14 bg-card border-b border-border
                 flex items-center justify-between px-4 shrink-0"
    >
      {/* Left — hamburger on mobile, empty on desktop */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="md:hidden p-2 rounded-lg text-muted-foreground
                     hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* App name — only shown on mobile next to hamburger */}
        <span className="md:hidden text-sm font-semibold text-foreground">
          RS Jewellery
        </span>
      </div>

      {/* Right — controls */}
      <div className="flex items-center gap-3">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </motion.header>
  )
}
