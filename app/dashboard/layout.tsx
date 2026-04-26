import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/shared/sidebar"
import Header from "@/components/shared/header"
import { checkProfileExists } from "@/lib/actions/setup"
import { AnimatePresenceWrapper } from "@/components/shared/animate-presence-wrapper"
import { SidebarProvider } from "@/lib/sidebar-context"
import { BottomNav } from "@/components/shared/bottom-nav"
import { prisma } from "@/lib/db"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  // Verify the user still exists in DB (handles stale JWT after DB reset)
  const userExists = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  })
  if (!userExists) {
    // Stale session — force sign out and go to login
    await signOut({ redirectTo: "/login" })
  }

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

          <main
            className="flex-1 overflow-y-auto hw-scroll p-4 pb-28 md:p-6 md:pb-6 print:p-0 print:overflow-visible print:block"
          >
            <AnimatePresenceWrapper>
              {children}
            </AnimatePresenceWrapper>
          </main>
        </div>
      </div>

      <BottomNav />
    </SidebarProvider>
  )
}