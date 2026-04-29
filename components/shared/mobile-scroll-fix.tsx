"use client"

import { useEffect, useRef } from "react"

export function MobileScrollFix({ children }: { children: React.ReactNode }) {
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    // Find the bottom nav element directly in the DOM
    const applyPadding = () => {
      const nav = document.querySelector("nav.fixed.bottom-0")
      const main = mainRef.current
      if (!nav || !main) return

      const navHeight = nav.getBoundingClientRect().height
      // Apply padding = nav height + 24px breathing room
      main.style.paddingBottom = `${navHeight + 24}px`
    }

    // Run immediately
    applyPadding()

    // Also run after a short delay (WebView sometimes paints late)
    const t1 = setTimeout(applyPadding, 300)
    const t2 = setTimeout(applyPadding, 800)

    // Re-run if window resizes
    window.addEventListener("resize", applyPadding)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener("resize", applyPadding)
    }
  }, [])

  return (
    <main
      ref={mainRef}
      className="flex-1 overflow-y-auto hw-scroll md:p-6 print:p-0 print:overflow-visible print:block"
      style={{ padding: "1rem" }}
    >
      {children}
    </main>
  )
}