"use client"

/**
 * MobileScrollFix
 * 
 * Wraps the main scroll container.
 * - Mobile (< 768px): padding-bottom = 58px nav + safe-area + 24px breathing room
 * - Desktop (≥ 768px): normal padding, no bottom nav
 * 
 * Using inline style for paddingBottom because Tailwind cannot do
 * dynamic calc() with CSS env() variables at build time.
 */

export function MobileScrollFix({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="flex-1 overflow-y-auto hw-scroll p-4 md:p-6 print:p-0 print:overflow-visible print:block"
      style={{
        // Mobile: exact nav height + device safe area + breathing room
        paddingBottom: "calc(58px + env(safe-area-inset-bottom, 0px) + 24px)",
      }}
      // On md+ screens override via a style tag trick — we use a data attr + CSS
      data-scroll-container
    >
      <style>{`
        @media (min-width: 768px) {
          [data-scroll-container] {
            padding-bottom: 1.5rem !important;
          }
        }
      `}</style>
      {children}
    </main>
  )
}
