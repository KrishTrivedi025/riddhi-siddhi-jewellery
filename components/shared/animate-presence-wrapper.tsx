"use client"

import { AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"

/**
 * Client wrapper that provides AnimatePresence keyed by pathname.
 * Placed in the dashboard layout around <main> children.
 *
 * Why a separate component?
 * The dashboard layout.tsx is a Server Component — AnimatePresence
 * is client-only, so we extract it here and import it into the layout.
 */
export function AnimatePresenceWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <div key={pathname} className="h-full">
        {children}
      </div>
    </AnimatePresence>
  )
}
