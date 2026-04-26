import { Suspense } from "react"
import { getDashboardOverview } from "@/lib/actions/dashboard"
import { MobileDashboard } from "@/components/dashboard/mobile-dashboard"
import { DesktopDashboard } from "@/components/dashboard/desktop-dashboard"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
        </Suspense>
    )
}

async function DashboardContent() {
    const data = await getDashboardOverview()

    if (!data.success) {
        return (
            <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center m-4">
                <h3 className="text-rose-500 font-semibold mb-2">Error Loading Dashboard</h3>
                <p className="text-muted-foreground text-sm">Please refresh the page to try again.</p>
            </div>
        )
    }

    return (
        <>
            {/* Mobile layout */}
            <div className="md:hidden">
                <MobileDashboard data={data} />
            </div>
            {/* Desktop layout */}
            <div className="hidden md:block">
                <DesktopDashboard data={data} />
            </div>
        </>
    )
}