"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { getExpenseReport } from "@/lib/actions/reports"
import { ReportShell, presetToRange, type DatePreset } from "./report-shell"
import { formatCurrency } from "@/lib/gst-utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type ReportData = Awaited<ReturnType<typeof getExpenseReport>>

const CATEGORY_COLORS = [
    "text-primary", "text-blue-400", "text-emerald-400", "text-violet-400",
    "text-rose-400", "text-amber-400", "text-cyan-400", "text-pink-400",
]

export function ExpenseReport() {
    const [data, setData]     = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(true)
    const [preset, setPreset]  = useState<DatePreset>("this_month")

    async function load(p: DatePreset) {
        setLoading(true)
        const d = await getExpenseReport(presetToRange(p))
        setData(d); setLoading(false)
    }
    useEffect(() => { load(preset) }, [])

    return (
        <ReportShell title="Expense Report" description="Category-wise expense analysis" icon="💸" accentColor="#EF4444"
            preset={preset} onPresetChange={(p) => { setPreset(p); load(p) }}>
            {loading && <div className="h-64 bg-card rounded-2xl border border-border animate-pulse"/>}
            {!loading && data && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-card border border-border rounded-xl p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Transactions</p>
                            <p className="text-lg font-bold font-mono text-foreground">{data.expenses.length}</p>
                        </div>
                        <div className="bg-card border border-rose-500/20 rounded-xl p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Spent</p>
                            <p className="text-lg font-bold font-mono text-rose-400">{formatCurrency(data.total)}</p>
                        </div>
                        <div className="bg-card border border-emerald-500/20 rounded-xl p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">GST ITC</p>
                            <p className="text-lg font-bold font-mono text-emerald-400">{formatCurrency(data.totalITC)}</p>
                        </div>
                    </div>

                    {/* Category breakdown */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <p className="text-sm font-semibold text-foreground mb-4">Category Breakdown</p>
                        <div className="space-y-3">
                            {data.byCategory.map((cat, i) => (
                                <div key={cat.name}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-sm font-medium ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}>{cat.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-muted-foreground">{cat.count} txn{cat.count !== 1 ? "s" : ""}</span>
                                            <span className="text-sm font-mono font-bold text-foreground">{formatCurrency(cat.amount)}</span>
                                            <span className="text-xs text-muted-foreground w-10 text-right">{cat.pct.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${cat.pct}%`, background: ["#D4A017","#3B82F6","#22C55E","#8B5CF6","#EF4444","#F59E0B","#06B6D4","#EC4899"][i % 8] }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Transaction list */}
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        {["Date","Category","Description","Account","GST ITC","Amount"].map(h => (
                                            <TableHead key={h} className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.expenses.map(e => (
                                        <TableRow key={e.id} className="border-border hover:bg-background/60">
                                            <TableCell className="text-muted-foreground text-xs font-mono whitespace-nowrap">{format(new Date(e.expenseDate), "dd MMM yy")}</TableCell>
                                            <TableCell className="text-primary text-xs font-semibold">{e.category}</TableCell>
                                            <TableCell className="text-muted-foreground text-xs max-w-[180px] truncate">{e.description || "—"}</TableCell>
                                            <TableCell className="text-muted-foreground text-xs">{e.bankAccount ? (e.bankAccount.isCash ? "Cash" : e.bankAccount.accountName) : "—"}</TableCell>
                                            <TableCell className="text-emerald-400 font-mono text-xs">{e.gstAmount > 0 ? formatCurrency(e.gstAmount) : "—"}</TableCell>
                                            <TableCell className="text-rose-400 font-mono font-semibold">{formatCurrency(e.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            )}
        </ReportShell>
    )
}
