"use client"

/**
 * Re-export of Framer Motion's useReducedMotion hook.
 *
 * Import from this file everywhere so:
 * 1. We have one import path to update if we ever swap the library.
 * 2. We can add project-wide override logic here (e.g. user preference in settings).
 *
 * Usage:
 *   const reduce = useReducedMotion()
 *   <motion.div variants={reduce ? {} : cardVariants} />
 */
export { useReducedMotion } from "framer-motion"
