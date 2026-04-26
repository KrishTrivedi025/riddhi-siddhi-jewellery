"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, ShoppingCart, Plus, Users, MoreHorizontal,
  Package, CreditCard, Landmark, Receipt, BarChart2, Settings, X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const mainNav = [
  { label: "Home",    href: "/dashboard",          icon: LayoutDashboard },
  { label: "Sales",   href: "/dashboard/sales",    icon: ShoppingCart    },
  { label: "Parties", href: "/dashboard/parties",  icon: Users           },
]

const moreItems = [
  { label: "Purchases",   href: "/dashboard/purchases",  icon: Package       },
  { label: "Inventory",   href: "/dashboard/inventory",  icon: Package       },
  { label: "Payments",    href: "/dashboard/payments",   icon: CreditCard    },
  { label: "Cash & Bank", href: "/dashboard/banks",      icon: Landmark      },
  { label: "Expenses",    href: "/dashboard/expenses",   icon: Receipt       },
  { label: "Reports",     href: "/dashboard/reports",    icon: BarChart2     },
  { label: "Settings",    href: "/dashboard/settings",   icon: Settings      },
]

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)

  return (
    <>
      {/* More drawer backdrop */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setMoreOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* More bottom sheet */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            key="more-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A1A] border-t border-[#2A2A2A] rounded-t-2xl pb-safe"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-zinc-600" />
            </div>

            <div className="flex items-center justify-between px-5 pb-3">
              <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">More</span>
              <button onClick={() => setMoreOpen(false)} className="text-zinc-500 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 px-4 pb-8">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-3 rounded-xl",
                    "bg-[#241F16] border border-[#2A2A2A] active:scale-95 transition-transform",
                    isActive(item.href) && "border-[#D4A017]/40"
                  )}
                >
                  <item.icon size={22} className={isActive(item.href) ? "text-[#D4A017]" : "text-zinc-400"} />
                  <span className="text-[10px] text-zinc-400 text-center leading-tight font-medium">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 border-t border-zinc-800 h-20 flex items-center justify-around px-2 pb-safe md:hidden">

        {/* First 2 nav items */}
        {mainNav.slice(0, 2).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors",
              isActive(item.href) ? "text-[#D4A017]" : "text-zinc-500"
            )}
          >
            <item.icon size={22} strokeWidth={isActive(item.href) ? 2.5 : 1.8} />
            <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
          </Link>
        ))}

        {/* Center FAB — New Sale */}
        <Link
          href="/dashboard/sales/new"
          className="flex flex-col items-center justify-center -mt-6"
        >
          <div className="w-14 h-14 rounded-full bg-[#D4A017] flex items-center justify-center shadow-lg shadow-[#D4A017]/30 active:scale-95 transition-transform">
            <Plus size={26} className="text-black" strokeWidth={2.5} />
          </div>
        </Link>

        {/* Last nav item */}
        {mainNav.slice(2).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors",
              isActive(item.href) ? "text-[#D4A017]" : "text-zinc-500"
            )}
          >
            <item.icon size={22} strokeWidth={isActive(item.href) ? 2.5 : 1.8} />
            <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
          </Link>
        ))}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center justify-center gap-1 w-16 h-full text-zinc-500"
        >
          <MoreHorizontal size={22} strokeWidth={1.8} />
          <span className="text-[10px] font-bold uppercase tracking-tight">More</span>
        </button>

      </nav>
    </>
  )
}
