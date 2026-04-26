import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/shared/sidebar"
import Header from "@/components/shared/header"
import { checkProfileExists } from "@/lib/actions/setup"
import { AnimatePresenceWrapper } from "@/components/shared/animate-presence-wrapper"
import { SidebarProvider } from "@/lib/sidebar-context"

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
      <div className="flex h-screen bg-background overflow-hidden print:h-auto print:bg-white print:block">
        {/* Sidebar — hidden on mobile, always shown on desktop */}
        <div className="print:hidden">
          <Sidebar />
        </div>

        {/* Main content — takes full width on mobile */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0 print:overflow-visible print:block">
          <div className="print:hidden">
            <Header />
          </div>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 print:p-0 print:overflow-visible print:block">
            <AnimatePresenceWrapper>
              {children}
            </AnimatePresenceWrapper>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}