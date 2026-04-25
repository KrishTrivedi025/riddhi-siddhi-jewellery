"use client"

import { motion } from "framer-motion"
import { pageVariants } from "@/lib/animations"
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion"

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
}

/**
 * Wrap every page's root element with this.
 * Provides the fade+slide entrance animation for route transitions.
 *
 * Usage:
 *   export default function SomePage() {
 *     return (
 *       <PageWrapper>
 *         <div className="space-y-8">...</div>
 *       </PageWrapper>
 *     )
 *   }
 */
export function PageWrapper({ children, className }: PageWrapperProps) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      variants={reduce ? {} : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  )
}
