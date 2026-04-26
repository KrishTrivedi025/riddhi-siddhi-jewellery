import { KPIGrid } from "./kpi-grid"
import { ChartsGrid } from "./charts-grid"
import { RecentTransactions } from "./recent-transactions"
import { QuickActions } from "./quick-actions"
import { PageWrapper } from "@/components/shared/page-wrapper"

interface DesktopDashboardProps {
  data: any
}

export function DesktopDashboard({ data }: DesktopDashboardProps) {
  return (
    <PageWrapper className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">Real-time business performance overview</p>
      </div>

      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <ChartsGrid data={data.charts} />
        </div>
        <div className="lg:col-span-1">
          <RecentTransactions transactions={data.transactions} />
        </div>
      </div>

      <KPIGrid stats={data.stats} />
    </PageWrapper>
  )
}
