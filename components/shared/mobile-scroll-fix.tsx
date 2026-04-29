"use client"

export function MobileScrollFix({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 overflow-y-auto hw-scroll p-4 md:p-6 print:p-0 print:overflow-visible print:block">
      {children}
    </main>
  )
}