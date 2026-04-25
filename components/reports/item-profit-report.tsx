"use client"

import { useEffect, useState } from "react"
import { getItemProfitReport } from "@/lib/actions/reports"
import { ReportShell, presetToRange, type DatePreset } from "./report-shell"
import { formatCurrency } from "@/lib/gst-utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

type ReportData = Awaited<ReturnType<typeof getItemProfitReport>>

export function ItemProfitReport() {
    const [data, setData]     = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(true)
    const [preset, setPreset]  = useState<DatePreset>("this_month")

    async function load(p: DatePreset) {
        setLoading(true)
        const d = await getItemProfitReport(presetToRange(p))
        setData(d); setLoading(false)
    }
    useEffect(() => { load(preset) }, [])

    return (
        <ReportShell title="Item-wise Profit" description="Profitability breakdown per item sold" icon="📈" accentColor="#D4A017"
            preset={preset} onPresetChange={(p) => { setPreset(p); load(p) }}>
            {loading && <div className="h-64 bg-card rounded-2xl border border-border animate-pulse"/>}
            {!loading && data && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-card border border-border rounded-xl p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Items Sold</p>
                            <p className="text-lg font-bold font-mono text-foreground">{data.rows.length}</p>
                        </div>
                        <div className="bg-card border border-emerald-500/20 rounded-xl p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Revenue</p>
                            <p className="text-lg font-bold font-mono text-emerald-400">{formatCurrency(data.totalRevenue)}</p>
                        </div>
                        <div className="bg-card border border-primary/20 rounded-xl p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Net Profit</p>
                            <p className={cn("text-lg font-bold font-mono", data.totalProfit >= 0 ? "text-primary" : "text-rose-400")}>
                                {formatCurrency(data.totalProfit)} <span className="text-sm text-muted-foreground">({data.overallMargin.toFixed(1)}%)</span>
                            </p>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        {["#","Item","Qty Sold","Revenue","Cost","Profit","Margin"].map(h => (
                                            <TableHead key={h} className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.rows.length === 0 && (
                                        <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">No sales data in this period</TableCell></TableRow>
                                    )}
                                    {data.rows.map((row, i) => {
                                        const isProfit = row.profit >= 0
                                        return (
                                            <TableRow key={row.itemId} className="border-border hover:bg-background/60">
                                                <TableCell className="text-muted-foreground text-xs font-mono">{i + 1}</TableCell>
                                                <TableCell className="text-foreground text-sm font-medium">{row.name}</TableCell>
                                                <TableCell className="text-muted-foreground font-mono text-sm">{row.qtySold}</TableCell>
                                                <TableCell className="text-emerald-400 font-mono text-sm">{formatCurrency(row.totalRevenue)}</TableCell>
                                                <TableCell className="text-blue-400 font-mono text-sm">{formatCurrency(row.totalCost)}</TableCell>
                                                <TableCell className={cn("font-mono font-bold text-sm", isProfit ? "text-primary" : "text-rose-400")}>
                                                    {isProfit ? "+" : ""}{formatCurrency(row.profit)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden w-20">
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    width: `${Math.min(Math.max(row.margin, 0), 100)}%`,
                                                                    background: row.margin >= 20 ? "#D4A017" : row.margin >= 5 ? "#F59E0B" : "#EF4444"
                                                                }}
                                                            />
                                                        </div>
                                                        <span className={cn("text-xs font-mono font-bold", isProfit ? "text-primary" : "text-rose-400")}>
                                                            {row.margin.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                    {data.rows.length > 0 && (
                                        <TableRow className="border-t-2 border-border bg-background">
                                            <TableCell colSpan={3} className="text-foreground text-xs font-bold">TOTAL</TableCell>
                                            <TableCell className="text-emerald-400 font-mono text-sm font-bold">{formatCurrency(data.totalRevenue)}</TableCell>
                                            <TableCell className="text-blue-400 font-mono text-sm font-bold">{formatCurrency(data.rows.reduce((s, r) => s + r.totalCost, 0))}</TableCell>
                                            <TableCell className={cn("font-mono font-bold text-sm", data.totalProfit >= 0 ? "text-primary" : "text-rose-400")}>{formatCurrency(data.totalProfit)}</TableCell>
                                            <TableCell className="text-primary font-mono text-sm font-bold">{data.overallMargin.toFixed(1)}%</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            )}
        </ReportShell>
    )
}
