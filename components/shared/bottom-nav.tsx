"use client"

/**
 * components/shared/bottom-nav.tsx
 *
 * Premium mobile bottom navigation bar.
 * Only visible on small screens (md:hidden).
 * Features:
 *  - Animated active indicator pill
 *  - Haptic-feel press animation
 *  - "More" sheet for secondary routes
 *  - Respects Android home-indicator safe area
 */

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  Receipt,
  BarChart2,
  Settings,
  Landmark,
  MoreHorizontal,
  X,
  ShoppingBag,
} from "lucide-react"
import { springSmooth, tapScale } from "@/lib/animations"

// ── Primary tabs (shown in the bar) ──────────────────────────────────────────
const PRIMARY = [
  { href: "/dashboard",           icon: LayoutDashboard, label: "Home"      },
  { href: "/dashboard/sales",      icon: ShoppingCart,    label: "Sales"     },
  { href: "/dashboard/inventory",  icon: Package,         label: "Inventory" },
  { href: "/dashboard/parties",    icon: Users,           label: "Parties"   },
]

// ── Secondary links (inside the More sheet) ───────────────────────────────────
const SECONDARY = [
  { href: "/dashboard/purchases",  icon: ShoppingBag,  label: "Purchases"   },
  { href: "/dashboard/payments",   icon: CreditCard,   label: "Payments"    },
  { href: "/dashboard/banks",      icon: Landmark,     label: "Cash & Bank" },
  { href: "/dashboard/expenses",   icon: Receipt,      label: "Expenses"    },
  { href: "/dashboard/reports",    icon: BarChart2,    label: "Reports"     },
  { href: "/dashboard/settings",   icon: Settings,     label: "Settings"    },
]

function isActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard"
  return pathname === href || pathname.startsWith(href + "/")
}

// ── More Sheet ────────────────────────────────────────────────────────────────
function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="
              fixed bottom-0 left-0 right-0 z-50 md:hidden
              bg-card border-t border-border rounded-t-3xl
              shadow-[0_-8px_40px_rgba(0,0,0,0.25)]
            "
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Close */}
            <div className="flex items-center justify-between px-6 pb-4">
              <p className="text-foreground font-semibold text-base">More</p>
              <motion.button
                whileTap={tapScale}
                onClick={onClose}
                className="p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </motion.button>
            </div>

            {/* Grid of links */}
            <div className="grid grid-cols-3 gap-2 px-4">
              {SECONDARY.map(({ href, icon: Icon, label }) => {
                const active = isActive(href, pathname)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={`
                      flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all duration-200 text-center
                      ${active
                        ? "bg-primary/10 border-primary/25 text-primary"
                        : "bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                      }
                    `}
                  >
                    <div className={`
                      w-9 h-9 rounded-xl flex items-center justify-center
                      ${active ? "bg-primary/20" : "bg-background"}
                    `}>
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-medium leading-tight">{label}</span>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Main BottomNav ────────────────────────────────────────────────────────────
export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  // Check if any secondary link is active
  const secondaryActive = SECONDARY.some(({ href }) => isActive(href, pathname))

  return (
    <>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />

      <nav
        className="
          md:hidden fixed bottom-0 left-0 right-0 z-30
          bg-card border-t border-border
        "
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft:  "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <div className="flex items-stretch h-[58px]">
          {/* Primary tabs */}
          {PRIMARY.map(({ href, icon: Icon, label }) => {
            const active = isActive(href, pathname)
            return (
              <Link
                key={href}
                href={href}
                className="relative flex-1 flex flex-col items-center justify-center gap-0.5 select-none"
              >
                <motion.div
                  whileTap={{ scale: 0.82 }}
                  transition={{ type: "spring", stiffness: 500, damping: 28 }}
                  className="flex flex-col items-center justify-center gap-0.5 w-full py-1"
                >
                  {/* Active pill background */}
                  {active && (
                    <motion.div
                      layoutId="bottom-active-pill"
                      className="absolute inset-x-1.5 top-1 h-9 rounded-2xl bg-primary/10"
                      transition={springSmooth}
                    />
                  )}

                  {/* Icon */}
                  <div className="relative z-10">
                    <Icon
                      size={20}
                      className={`transition-colors duration-200 ${
                        active ? "text-primary" : "text-muted-foreground"
                      }`}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={`relative z-10 text-[9.5px] font-semibold tracking-wide transition-colors duration-200 ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </motion.div>
              </Link>
            )
          })}

          {/* More button */}
          <motion.button
            className="relative flex-1 flex flex-col items-center justify-center gap-0.5 select-none"
            whileTap={{ scale: 0.82 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            onClick={() => setMoreOpen(v => !v)}
            aria-label="More options"
          >
            {/* Active pill when a secondary route is selected */}
            {secondaryActive && (
              <motion.div
                layoutId="bottom-active-pill"
                className="absolute inset-x-1.5 top-1 h-9 rounded-2xl bg-primary/10"
                transition={springSmooth}
              />
            )}

            <div className="relative z-10">
              <MoreHorizontal
                size={20}
                className={`transition-colors duration-200 ${
                  secondaryActive || moreOpen ? "text-primary" : "text-muted-foreground"
                }`}
                strokeWidth={secondaryActive || moreOpen ? 2.2 : 1.8}
              />
            </div>
            <span
              className={`relative z-10 text-[9.5px] font-semibold tracking-wide transition-colors duration-200 ${
                secondaryActive || moreOpen ? "text-primary" : "text-muted-foreground"
              }`}
            >
              More
            </span>
          </motion.button>
        </div>
      </nav>
    </>
  )
}
