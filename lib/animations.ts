import { type Variants, type Transition } from "framer-motion"

// ─────────────────────────────────────────────────────────────
// Shared Transitions
// ─────────────────────────────────────────────────────────────

/** Snappy spring — buttons, nav items, small UI elements */
export const spring: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
}

/** Smooth spring — cards, dialogs, panels */
export const springSmooth: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 28,
}

/** Ease-out-quart — page transitions, fades */
export const ease: Transition = {
  duration: 0.22,
  ease: [0.25, 0.46, 0.45, 0.94],
}

/** Slow ease — overlays, backdrops */
export const easeSlow: Transition = {
  duration: 0.3,
  ease: [0.25, 0.46, 0.45, 0.94],
}

// ─────────────────────────────────────────────────────────────
// Page / Route Transitions
// ─────────────────────────────────────────────────────────────

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      ...ease,
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.16, ease: "easeIn" },
  },
}

// ─────────────────────────────────────────────────────────────
// Stagger Containers
// ─────────────────────────────────────────────────────────────

/** Wrap grids / lists — children stagger in sequence */
export const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
}

/** Faster stagger for dense lists (tables, nav items) */
export const containerFastVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
}

// ─────────────────────────────────────────────────────────────
// Card / List Item
// ─────────────────────────────────────────────────────────────

/** Standard card entrance — used for KPI cards, content blocks */
export const itemVariants: Variants = {
  initial: { opacity: 0, y: 18, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springSmooth,
  },
}

/** Subtle item — for dense UI like table rows */
export const rowVariants: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { ...ease, duration: 0.18 },
  },
  exit: {
    opacity: 0,
    x: -12,
    transition: { duration: 0.14 },
  },
}

// ─────────────────────────────────────────────────────────────
// Sidebar Navigation
// ─────────────────────────────────────────────────────────────

/** Sidebar nav items stagger in from left */
export const navItemVariants: Variants = {
  initial: { opacity: 0, x: -16 },
  animate: {
    opacity: 1,
    x: 0,
    transition: spring,
  },
}

/** Sidebar panel slide in/out (mobile drawer) */
export const sidebarVariants: Variants = {
  open: {
    x: 0,
    transition: springSmooth,
  },
  closed: {
    x: -260,
    transition: { ...ease, duration: 0.2 },
  },
}

// ─────────────────────────────────────────────────────────────
// Dialogs & Modals
// ─────────────────────────────────────────────────────────────

/** Main dialog content box */
export const dialogVariants: Variants = {
  initial: { opacity: 0, scale: 0.94, y: 14 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springSmooth,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.16, ease: "easeIn" },
  },
}

/** Backdrop / overlay */
export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.22, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.16, ease: "easeIn" },
  },
}

// ─────────────────────────────────────────────────────────────
// Header / Top Bar
// ─────────────────────────────────────────────────────────────

export const headerVariants: Variants = {
  initial: { opacity: 0, y: -12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { ...ease, delay: 0.05 },
  },
}

// ─────────────────────────────────────────────────────────────
// Theme / Icon Toggles
// ─────────────────────────────────────────────────────────────

/** Icon swap inside theme toggle button */
export const iconSwapVariants: Variants = {
  initial: { rotate: -90, opacity: 0, scale: 0.5 },
  animate: {
    rotate: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.22, ease: "easeOut" },
  },
  exit: {
    rotate: 90,
    opacity: 0,
    scale: 0.5,
    transition: { duration: 0.16 },
  },
}

// ─────────────────────────────────────────────────────────────
// Micro-interactions
// ─────────────────────────────────────────────────────────────

/** Button press — add to whileTap */
export const tapScale = { scale: 0.95 } as const

/** Card hover lift — add to whileHover */
export const hoverLift = { y: -2, transition: spring } as const

/** Nav item hover nudge — add to whileHover */
export const hoverNudge = { x: 3, transition: spring } as const

// ─────────────────────────────────────────────────────────────
// Form Feedback
// ─────────────────────────────────────────────────────────────

/** Shake a field on validation error */
export const shakeVariants: Variants = {
  shake: {
    x: [0, -6, 6, -5, 5, -3, 3, 0],
    transition: { duration: 0.38, ease: "easeInOut" },
  },
}

/** Fade + scale in for inline error messages */
export const errorVariants: Variants = {
  initial: { opacity: 0, y: -4, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18 } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.12 } },
}

// ─────────────────────────────────────────────────────────────
// Skeleton / Shimmer
// ─────────────────────────────────────────────────────────────

export const shimmerVariants: Variants = {
  animate: {
    backgroundPosition: ["200% 0%", "-200% 0%"],
  },
}

export const shimmerTransition: Transition = {
  duration: 1.6,
  ease: "linear",
  repeat: Infinity,
}

// ─────────────────────────────────────────────────────────────
// Number Count-Up (used with useSpring + useMotionValue)
// ─────────────────────────────────────────────────────────────

/** Spring config for KPI number count-up */
export const countUpSpring = {
  stiffness: 80,
  damping: 20,
  mass: 1,
} as const
