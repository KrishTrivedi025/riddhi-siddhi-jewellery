"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PageWrapper } from "@/components/shared/page-wrapper"
import { ReportNav, type ReportId } from "@/components/reports/report-nav"
import { ProfitLossReport }             from "@/components/reports/profit-loss-report"
import { SalesReport }                  from "@/components/reports/sales-report"
import { PurchaseReport }               from "@/components/reports/purchase-report"
import { OutstandingReceivableReport }  from "@/components/reports/outstanding-receivable-report"
import { OutstandingPayableReport }     from "@/components/reports/outstanding-payable-report"
import { StockSummaryReport }           from "@/components/reports/stock-summary-report"
import { StockMovementReport }          from "@/components/reports/stock-movement-report"
import { ExpenseReport }                from "@/components/reports/expense-report"
import { DayBookReport }                from "@/components/reports/daybook-report"
import { CashBankBookReport }           from "@/components/reports/cashbank-book-report"
import { ItemProfitReport }             from "@/components/reports/item-profit-report"
import { itemVariants, ease } from "@/lib/animations"

const reportTransition = { duration: 0.18, ease: ease.ease as number[] }

function ActiveReport({ id }: { id: ReportId }) {
    switch (id) {
        case "profit_loss":    return <ProfitLossReport />
        case "sales":          return <SalesReport />
        case "purchase":       return <PurchaseReport />
        case "receivable":     return <OutstandingReceivableReport />
        case "payable":        return <OutstandingPayableReport />
        case "stock_summary":  return <StockSummaryReport />
        case "stock_movement": return <StockMovementReport />
        case "expense":        return <ExpenseReport />
        case "day_book":       return <DayBookReport />
        case "cash_bank_book": return <CashBankBookReport />
        case "item_profit":    return <ItemProfitReport />
        default:               return <ProfitLossReport />
    }
}

export default function ReportsPage() {
    const [activeReport, setActiveReport] = useState<ReportId>("profit_loss")

    return (
        <PageWrapper className="flex flex-col gap-6 h-full print:h-auto print:block">
            {/* Page header */}
            <div className="flex items-center gap-3 print:hidden">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl">
                    📊
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Reports</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Business analytics · Financial statements · Ledgers
                    </p>
                </div>
            </div>

            {/* Main layout: sidebar + content */}
            <div className="flex gap-6 flex-1 min-h-0 print:block print:min-h-0">
                {/* Left nav */}
                <div className="print:hidden shrink-0">
                    <ReportNav active={activeReport} onChange={setActiveReport} />
                </div>

                {/* Report content — animate on report switch */}
                <main className="flex-1 min-w-0 print:w-full print:m-0 print:p-0">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={activeReport}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={reportTransition}
                        >
                            <ActiveReport id={activeReport} />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </PageWrapper>
    )
}
