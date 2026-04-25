import { Suspense } from "react"
import { PageWrapper } from "@/components/shared/page-wrapper"
import { KPIGrid } from "@/components/dashboard/kpi-grid"
import { KPISkeleton } from "@/components/dashboard/kpi-skeleton"
import { ChartsGrid } from "@/components/dashboard/charts-grid"
import { Skeleton } from "@/components/ui/skeleton"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { RecentTransactionsSkeleton } from "@/components/dashboard/recent-transactions-skeleton"
import { getDashboardOverview } from "@/lib/actions/dashboard"

export default function DashboardPage() {
    return (
        <PageWrapper className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Real-time business performance overview</p>
                </div>
            </div>

            <QuickActions />

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
            <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center">
                <h3 className="text-rose-500 font-semibold mb-2">Error Loading Dashboard</h3>
                <p className="text-muted-foreground text-sm">Please refresh the page to try again. The database connection may be busy.</p>
            </div>
        )
    }

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <ChartsGrid data={data.charts} />
                </div>
                
                <div className="lg:col-span-1">
                    <RecentTransactions transactions={data.transactions} />
                </div>
            </div>

            <KPIGrid stats={data.stats} />
        </>
    )
}

function DashboardLoading() {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <ChartsSkeleton />
                </div>
                <div className="lg:col-span-1">
                    <RecentTransactionsSkeleton />
                </div>
            </div>
            <KPISkeleton />
        </div>
    )
}

function ChartsSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-[350px] w-full rounded-2xl bg-card border border-border" />
            ))}
        </div>
    )
}