export const dynamic = "force-dynamic"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/shared/sidebar"
import Header from "@/components/shared/header"
import { checkProfileExists } from "@/lib/actions/setup"
import { AnimatePresenceWrapper } from "@/components/shared/animate-presence-wrapper"
import { SidebarProvider } from "@/lib/sidebar-context"
import { BottomNav } from "@/components/shared/bottom-nav"
import { MobileScrollFix } from "@/components/shared/mobile-scroll-fix"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const hasProfile = await checkProfileExists()
  if (!hasProfile) redirect("/setup")

  return (
    <SidebarProvider>
      <div
        className="flex bg-background overflow-hidden print:bg-white print:block"
        style={{ height: "100dvh" }}
      >
        <div className="print:hidden">
          <Sidebar />
        </div>

        <div className="flex flex-col flex-1 overflow-hidden min-w-0 print:overflow-visible print:block">
          <div className="print:hidden">
            <Header />
          </div>

          <MobileScrollFix>
            <AnimatePresenceWrapper>
              {children}
            </AnimatePresenceWrapper>
          </MobileScrollFix>
        </div>
      </div>

      <BottomNav />
    </SidebarProvider>
  )
}