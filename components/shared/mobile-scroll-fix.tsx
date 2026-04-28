"use client"

/**
 * MobileScrollFix
 * Pure CSS solution — no JS, no useEffect, no timing issues.
 * 
 * Bottom nav height = 58px
 * Safe area inset (home bar on notch phones) = env(safe-area-inset-bottom)
 * Extra breathing room = 24px
 * 
 * On desktop (md+) the bottom nav is hidden so normal padding applies.
 */
export function MobileScrollFix({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 overflow-y-auto hw-scroll p-4 md:p-6 print:p-0 print:overflow-visible print:block mobile-scroll-container">
      {children}
    </main>
  )
}
