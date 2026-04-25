import { Suspense } from "react"
import { PageWrapper } from "@/components/shared/page-wrapper"
import { getExpenses, getExpenseSummary, getMonthlyExpenseTrend } from "@/lib/actions/expenses"
import { getBankAccounts } from "@/lib/actions/banks"
import { ExpenseDialog } from "@/components/expenses/expense-dialog"
import { ExpenseTable } from "@/components/expenses/expense-table"
import { ExpenseSummaryCards } from "@/components/expenses/expense-summary-cards"
import { ExpenseCategoryChart } from "@/components/expenses/expense-category-chart"
import { ExpenseTrendChart } from "@/components/expenses/expense-trend-chart"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
    title: "Expenses | Riddhi Siddhi Jewellery",
    description: "Track and manage all business expenses with GST input credit",
}

export default function ExpensesPage() {
    return (
        <PageWrapper className="space-y-8">
            <Suspense fallback={<ExpensesPageSkeleton />}>
                <ExpensesData />
            </Suspense>
        </PageWrapper>
    )
}

async function ExpensesData() {
    // Fetch all data in parallel (sequential to respect single-connection DB pool limit)
    const expenses  = await getExpenses()
    const summary   = await getExpenseSummary()
    const trend     = await getMonthlyExpenseTrend()
    const accounts  = await getBankAccounts()

    // Estimate month count from the trend data (non-zero months)
    const activeMonths = trend.filter((m) => m.amount > 0).length || 1

    return (
        <div className="space-y-6">

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-xl">
                            💸
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Track outflows · Claim GST input credit · Analyse spend
                            </p>
                        </div>
                    </div>
                </div>
                <ExpenseDialog accounts={accounts} />
            </div>

            {/* ── KPI Summary Cards ────────────────────────────────────────── */}
            <ExpenseSummaryCards
                totalAmount={summary.totalAmount}
                totalGstCredit={summary.totalGstCredit}
                count={summary.count}
                monthCount={activeMonths}
            />

            {/* ── Charts Row ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ExpenseCategoryChart data={summary.categoryBreakdown} />
                <ExpenseTrendChart data={trend} />
            </div>

            {/* ── Expense Table ───────────────────────────────────────────── */}
            <ExpenseTable expenses={expenses as any} accounts={accounts} />
        </div>
    )
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────

function ExpensesPageSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl bg-muted" />
                    <div>
                        <Skeleton className="h-7 w-36 bg-muted" />
                        <Skeleton className="h-4 w-56 mt-2 bg-muted" />
                    </div>
                </div>
                <Skeleton className="h-10 w-32 bg-muted rounded-xl" />
            </div>

            {/* Cards skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-28 bg-muted rounded-2xl border border-border" />
                ))}
            </div>

            {/* Charts skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-64 bg-muted rounded-2xl border border-border" />
                <Skeleton className="h-64 bg-muted rounded-2xl border border-border" />
            </div>

            {/* Table skeleton */}
            <Skeleton className="h-96 w-full bg-muted rounded-2xl border border-border" />
        </div>
    )
}
