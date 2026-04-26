"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, ShoppingCart, Package, Users,
  CreditCard, Receipt, BarChart2, Settings, Landmark, X,
} from "lucide-react"
import {
  containerFastVariants,
  navItemVariants,
  hoverNudge,
  tapScale,
  springSmooth,
} from "@/lib/animations"
import { useT } from "@/lib/i18n/client"
import { useSidebar } from "@/lib/sidebar-context"

const navItems = [
  { translationKey: "dashboard", href: "/dashboard",           icon: LayoutDashboard },
  { translationKey: "sales",     href: "/dashboard/sales",      icon: ShoppingCart    },
  { translationKey: "purchases", href: "/dashboard/purchases",  icon: Package         },
  { translationKey: "inventory", href: "/dashboard/inventory",  icon: Package         },
  { translationKey: "parties",   href: "/dashboard/parties",    icon: Users           },
  { translationKey: "payments",  href: "/dashboard/payments",   icon: CreditCard      },
  { translationKey: "cashBank",  href: "/dashboard/banks",      icon: Landmark        },
  { translationKey: "expenses",  href: "/dashboard/expenses",   icon: Receipt         },
  { translationKey: "reports",   href: "/dashboard/reports",    icon: BarChart2       },
  { translationKey: "settings",  href: "/dashboard/settings",   icon: Settings        },
]

// ── Shared sidebar content ────────────────────────────────────────────────────
function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname()
  const { t } = useT("nav")

  return (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08 }}
            transition={{ duration: 0.5 }}
            className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20
                       flex items-center justify-center text-sm select-none"
          >
            💎
          </motion.div>
          <div>
            <p className="text-foreground text-sm font-semibold leading-tight">
              Riddhi Siddhi
            </p>
            <p className="text-muted-foreground text-xs">Jewellery</p>
          </div>
        </div>

        {/* Close button — only shown on mobile */}
        {onNavClick && (
          <button
            onClick={onNavClick}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <motion.nav
        variants={containerFastVariants}
        initial="initial"
        animate="animate"
        className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"
      >
        {navItems.map(({ translationKey, href, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === href || pathname.startsWith(href + "/")

          return (
            <motion.div
              key={href}
              variants={navItemVariants}
              whileHover={hoverNudge}
              whileTap={tapScale}
            >
              <Link
                href={href}
                onClick={onNavClick}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                  transition-colors duration-150 overflow-hidden
                  ${active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active-bg"
                    className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
                    transition={springSmooth}
                  />
                )}
                {!active && (
                  <motion.span
                    className="absolute inset-0 rounded-xl bg-transparent"
                    whileHover={{ backgroundColor: "hsl(var(--muted))" }}
                    transition={{ duration: 0.15 }}
                  />
                )}
                <span className="relative z-10"><Icon size={16} /></span>
                <span className="relative z-10">{t(translationKey)}</span>
              </Link>
            </motion.div>
          )
        })}
      </motion.nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-muted-foreground text-[11px] text-center">
          Riddhi Siddhi Jewellery © 2025
        </p>
      </div>
    </>
  )
}

// ── Main Sidebar export ───────────────────────────────────────────────────────
export default function Sidebar() {
  const { isOpen, close } = useSidebar()

  return (
    <>
      {/* ── Desktop sidebar — always visible on md+ ── */}
      <aside className="hidden md:flex w-60 bg-card border-r border-border flex-col h-full shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer — slides in from left ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={close}
            />

            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 left-0 z-50 h-full w-72 bg-card border-r border-border
                         flex flex-col md:hidden shadow-2xl"
              style={{
                // Push content below the Android status bar / notch
                paddingTop: "env(safe-area-inset-top)",
              }}
            >
              <SidebarContent onNavClick={close} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}