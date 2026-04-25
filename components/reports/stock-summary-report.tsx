"use client"

import { useEffect, useState } from "react"
import { getStockSummaryReport } from "@/lib/actions/reports"
import { ReportShell } from "./report-shell"
import { formatCurrency } from "@/lib/gst-utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

type ReportData = Awaited<ReturnType<typeof getStockSummaryReport>>

export function StockSummaryReport() {
    const [data, setData] = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(true)
    useEffect(() => { getStockSummaryReport().then(d => { setData(d); setLoading(false) }) }, [])

    return (
        <ReportShell title="Stock Summary" description="Current inventory levels and valuations" icon="📦" accentColor="#F59E0B" showDateFilter={false}>
            {loading && <div className="h-64 bg-card rounded-2xl border border-border animate-pulse"/>}
            {!loading && data && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MiniCard label="Total Items"   value={String(data.totalItems)}        color="text-blue-400" />
                        <MiniCard label="Cost Value"    value={formatCurrency(data.totalCostVal)} color="text-primary" />
                        <MiniCard label="Sale Value"    value={formatCurrency(data.totalSaleVal)} color="text-emerald-400" />
                        <MiniCard label="Low/Out Stock" value={`${data.lowStockCount + data.outOfStock}`} color="text-rose-400" />
                    </div>

                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        {["Item","Category","Unit","Stock","Cost Price","Sale Price","Cost Value","Sale Value","Status"].map(h => (
                                            <TableHead key={h} className="text-muted-foreground text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.items.map(item => {
                                        const isOut  = item.currentStock <= 0
                                        const isLow  = !isOut && item.currentStock <= item.lowStockAlert && item.lowStockAlert > 0
                                        const status = isOut ? "Out of Stock" : isLow ? "Low Stock" : "OK"
                                        const sBadge = isOut
                                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                            : isLow
                                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        return (
                                            <TableRow key={item.id} className="border-border hover:bg-background/60">
                                                <TableCell className="text-foreground text-sm font-medium">{item.name}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs">{item.category?.name || "—"}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs">{item.unit}</TableCell>
                                                <TableCell className={cn("font-mono font-bold text-sm", isOut ? "text-rose-400" : isLow ? "text-amber-400" : "text-foreground")}>{item.currentStock}</TableCell>
                                                <TableCell className="text-muted-foreground font-mono text-xs">{formatCurrency(item.purchasePrice)}</TableCell>
                                                <TableCell className="text-muted-foreground font-mono text-xs">{formatCurrency(item.salePrice)}</TableCell>
                                                <TableCell className="text-primary font-mono text-sm">{formatCurrency(item.currentStock * item.purchasePrice)}</TableCell>
                                                <TableCell className="text-emerald-400 font-mono text-sm">{formatCurrency(item.currentStock * item.salePrice)}</TableCell>
                                                <TableCell>
                                                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border", sBadge)}>{status}</span>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            )}
        </ReportShell>
    )
}

function MiniCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
        </div>
    )
}
