"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { getSalesReport } from "@/lib/actions/reports"
import { ReportShell, presetToRange, type DatePreset } from "./report-shell"
import { formatCurrency } from "@/lib/gst-utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

type ReportData = Awaited<ReturnType<typeof getSalesReport>>

const STATUS_STYLE: Record<string, string> = {
    paid:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    partial: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    unpaid:  "bg-rose-500/10 text-rose-400 border-rose-500/20",
}

export function SalesReport() {
    const [data, setData] = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(true)
    const [preset, setPreset] = useState<DatePreset>("this_month")

    async function load(p: DatePreset) {
        setLoading(true)
        const d = await getSalesReport(presetToRange(p))
        setData(d); setLoading(false)
    }
    useEffect(() => { load(preset) }, [])

    return (
        <ReportShell title="Sales Report" description="All sale invoices" icon="🧾" accentColor="#22C55E"
            preset={preset} onPresetChange={(p) => { setPreset(p); load(p) }}>
            {loading && <Skeleton />}
            {!loading && data && (
                <div className="space-y-4">
                    {/* KPI row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MiniCard label="Total Sales"    value={formatCurrency(data.totals.grandTotal)} color="text-emerald-400" />
                        <MiniCard label="Taxable"        value={formatCurrency(data.totals.taxableAmount)} color="text-blue-400" />
                        <MiniCard label="GST Collected"  value={formatCurrency(data.totals.cgst + data.totals.sgst + data.totals.igst)} color="text-primary" />
                        <MiniCard label="Outstanding"    value={formatCurrency(data.totals.balanceDue)} color="text-rose-400" />
                    </div>

                    <div className="bg-card border border-border rounded-2xl overflow-hidden print:border-none print:bg-transparent">
                        <div className="overflow-x-auto print:overflow-visible">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        {["Date","Invoice No.","Party","Taxable","GST","Total","Paid","Balance","Status"].map(h => (
                                            <TableHead key={h} className="text-muted-foreground text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.invoices.length === 0 && (
                                        <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground text-sm">No sales in this period</TableCell></TableRow>
                                    )}
                                    {data.invoices.map(inv => (
                                        <TableRow key={inv.id} className="border-border hover:bg-background/60">
                                            <TableCell className="text-muted-foreground text-xs font-mono whitespace-nowrap">{format(new Date(inv.invoiceDate), "dd MMM yy")}</TableCell>
                                            <TableCell className="text-primary text-xs font-mono font-semibold">{inv.invoiceNumber}</TableCell>
                                            <TableCell className="text-foreground text-xs">{inv.party.name}</TableCell>
                                            <TableCell className="text-muted-foreground text-xs font-mono text-right">{formatCurrency(inv.taxableAmount)}</TableCell>
                                            <TableCell className="text-muted-foreground text-xs font-mono text-right">{formatCurrency(inv.cgst + inv.sgst + inv.igst)}</TableCell>
                                            <TableCell className="text-emerald-400 text-xs font-mono font-semibold text-right">{formatCurrency(inv.grandTotal)}</TableCell>
                                            <TableCell className="text-muted-foreground text-xs font-mono text-right">{formatCurrency(inv.amountPaid)}</TableCell>
                                            <TableCell className="text-rose-400 text-xs font-mono text-right">{formatCurrency(inv.balanceDue)}</TableCell>
                                            <TableCell>
                                                <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border capitalize", STATUS_STYLE[inv.paymentStatus] || STATUS_STYLE.unpaid)}>
                                                    {inv.paymentStatus}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Totals row */}
                                    {data.invoices.length > 0 && (
                                        <TableRow className="border-t-2 border-border bg-background font-bold">
                                            <TableCell colSpan={3} className="text-foreground text-xs font-bold">TOTAL ({data.invoices.length} invoices)</TableCell>
                                            <TableCell className="text-blue-400 font-mono text-xs text-right">{formatCurrency(data.totals.taxableAmount)}</TableCell>
                                            <TableCell className="text-primary font-mono text-xs text-right">{formatCurrency(data.totals.cgst + data.totals.sgst + data.totals.igst)}</TableCell>
                                            <TableCell className="text-emerald-400 font-mono text-xs text-right font-bold">{formatCurrency(data.totals.grandTotal)}</TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-xs text-right">{formatCurrency(data.totals.amountPaid)}</TableCell>
                                            <TableCell className="text-rose-400 font-mono text-xs text-right">{formatCurrency(data.totals.balanceDue)}</TableCell>
                                            <TableCell />
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

function MiniCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
        </div>
    )
}

function Skeleton() {
    return <div className="h-64 bg-card rounded-2xl border border-border animate-pulse"/>
}
