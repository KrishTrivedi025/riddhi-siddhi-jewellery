"use client"

/**
 * MobileScrollFix
 * Gives the scrollable content area enough bottom padding
 * so nothing hides behind the fixed bottom nav (58px tall).
 * On desktop (md+) bottom nav is hidden so normal padding applies.
 */
export function MobileScrollFix({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="flex-1 overflow-y-auto hw-scroll md:p-6 print:p-0 print:overflow-visible print:block"
      style={{
        // ✅ Use inline style to completely avoid Tailwind cascade battles
        // p-4 is REMOVED from className — no more shorthand override conflict
        padding: "1rem",                           // default p-4 equivalent
        paddingBottom: "calc(58px + 1.5rem)",      // 58px nav + 24px breathing room
      }}
    >
      {children}
    </main>
  )
}