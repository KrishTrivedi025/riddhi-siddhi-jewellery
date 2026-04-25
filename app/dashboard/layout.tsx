import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/shared/sidebar"
import Header from "@/components/shared/header"
import { checkProfileExists } from "@/lib/actions/setup"
import { AnimatePresenceWrapper } from "@/components/shared/animate-presence-wrapper"

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
    <div className="flex h-screen bg-background overflow-hidden print:h-auto print:bg-white print:block">
      <div className="print:hidden">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden print:overflow-visible print:block">
        <div className="print:hidden">
          <Header />
        </div>

        <main className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible print:block">
          <AnimatePresenceWrapper>
            {children}
          </AnimatePresenceWrapper>
        </main>
      </div>
    </div>
  )
}