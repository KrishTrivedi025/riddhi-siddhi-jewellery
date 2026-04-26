import { Suspense } from "react"
import { PageWrapper } from "@/components/shared/page-wrapper"
import { KPIGrid } from "@/components/dashboard/kpi-grid"
import { KPISkeleton } from "@/components/dashboard/kpi-skeleton"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { RecentTransactionsSkeleton } from "@/components/dashboard/recent-transactions-skeleton"
import { getDashboardOverview } from "@/lib/actions/dashboard"

export default function DashboardPage() {
    return (
        <PageWrapper className="space-y-5">
            {/* Page heading */}
            <div>
                <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-0.5 text-xs">Real-time business overview</p>
            </div>

            {/* Quick action shortcuts */}
            <QuickActions />

            {/* Async data section */}
            <Suspense fallback={<DashboardLoading />}>
                <DashboardContent />
            </Suspense>
        </PageWrapper>
    )
}

async function DashboardContent() {
    const data = await getDashboardOverview()

    if (!data.success) {
        return (
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center">
                <h3 className="text-rose-500 font-semibold mb-1">Error Loading Dashboard</h3>
                <p className="text-muted-foreground text-sm">Please refresh to try again.</p>
            </div>
        )
    }

    return (
        <div className="space-y-5">
            {/* KPI stats grid — compact, 2-col on mobile */}
            <KPIGrid stats={data.stats} />

            {/* Recent transactions — full width on mobile */}
            <RecentTransactions transactions={data.transactions} />
        </div>
    )
}

function DashboardLoading() {
    return (
        <div className="space-y-5">
            <KPISkeleton />
            <RecentTransactionsSkeleton />
        </div>
    )
}