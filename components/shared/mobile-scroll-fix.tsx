"use client"

import { useEffect, useRef } from "react"

/**
 * MobileScrollFix — sets exact padding-bottom so content
 * never hides under the bottom nav bar on ANY mobile device.
 * 
 * Bottom nav = 58px + env(safe-area-inset-bottom)
 * We add 20px breathing room = total clearance guaranteed.
 */
export function MobileScrollFix({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const apply = () => {
      if (window.innerWidth < 768) {
        // Get actual safe-area value
        const safeArea = parseInt(
          getComputedStyle(document.documentElement)
            .getPropertyValue("--sat") || "0"
        ) || 0
        el.style.paddingBottom = `${58 + safeArea + 20}px`
      } else {
        el.style.paddingBottom = "1.5rem"
      }
    }

    apply()
    window.addEventListener("resize", apply)
    return () => window.removeEventListener("resize", apply)
  }, [])

  return (
    <main
      ref={ref}
      className="flex-1 overflow-y-auto hw-scroll p-4 md:p-6 print:p-0 print:overflow-visible print:block"
    >
      {children}
    </main>
  )
}