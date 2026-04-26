import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/shared/sidebar"
import Header from "@/components/shared/header"
import { checkProfileExists } from "@/lib/actions/setup"
import { AnimatePresenceWrapper } from "@/components/shared/animate-presence-wrapper"
import { SidebarProvider } from "@/lib/sidebar-context"
import { BottomNav } from "@/components/shared/bottom-nav"

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
      {/* 
        Use 100dvh (Dynamic Viewport Height) — unlike h-screen this correctly
        accounts for the Android keyboard and browser chrome in Capacitor.
      */}
      <div
        className="flex bg-background overflow-hidden print:bg-white print:block"
        style={{ height: "100dvh" }}
      >
        {/* Sidebar — hidden on mobile (md:hidden), visible desktop */}
        <div className="print:hidden">
          <Sidebar />
        </div>

        {/* Main content column */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0 print:overflow-visible print:block">
          {/* Top header bar — hidden when printing */}
          <div className="print:hidden">
            <Header />
          </div>

          {/*
            Main scroll area.
            On mobile:  extra bottom padding so content isn't hidden behind BottomNav.
            On desktop: normal md:pb-6.
          */}
          <main
            className="
              flex-1 overflow-y-auto hw-scroll
              p-4 md:p-6
              pb-24 md:pb-6
              print:p-0 print:overflow-visible print:block
            "
            style={{
              // Extra padding for devices with a home indicator (Android gesture nav bar)
              paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom))",
            }}
          >
            <AnimatePresenceWrapper>
              {children}
            </AnimatePresenceWrapper>
          </main>
        </div>
      </div>

      {/* Premium mobile bottom navigation — md:hidden */}
      <BottomNav />
    </SidebarProvider>
  )
}