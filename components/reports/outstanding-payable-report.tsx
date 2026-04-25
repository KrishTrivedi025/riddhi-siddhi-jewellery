"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getOutstandingPayableReport } from "@/lib/actions/reports"
import { ReportShell } from "./report-shell"
import { formatCurrency } from "@/lib/gst-utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type ReportData = Awaited<ReturnType<typeof getOutstandingPayableReport>>

export function OutstandingPayableReport() {
    const [data, setData] = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(true)
    useEffect(() => { getOutstandingPayableReport().then(d => { setData(d); setLoading(false) }) }, [])

    return (
        <ReportShell title="Outstanding Payable" description="Money you owe to suppliers" icon="📤" accentColor="#EF4444" showDateFilter={false}>
            {loading && <div className="h-64 bg-card rounded-2xl border border-border animate-pulse"/>}
            {!loading && data && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: "0–30 Days",  value: data.buckets.b0,  color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                            { label: "31–60 Days", value: data.buckets.b30, color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" },
                            { label: "61–90 Days", value: data.buckets.b60, color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20" },
                            { label: "90+ Days",   value: data.buckets.b90, color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/20" },
                        ].map(b => (
                            <div key={b.label} className={`bg-card border rounded-2xl p-4 ${b.bg}`}>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{b.label}</p>
                                <p className={`text-xl font-bold font-mono ${b.color}`}>{formatCurrency(b.value)}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between px-5 py-3 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                        <span className="text-sm font-bold text-foreground">Total Outstanding Payable</span>
                        <span className="text-xl font-black text-rose-400 font-mono">{formatCurrency(data.grandTotal)}</span>
                    </div>

                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        {["Supplier","Total Due","0–30","31–60","61–90","90+"].map(h => (
                                            <TableHead key={h} className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.parties.length === 0 && (
                                        <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">🎉 No outstanding payables!</TableCell></TableRow>
                                    )}
                                    {data.parties.map(p => (
                                        <TableRow key={p.id} className="border-border hover:bg-background/60">
                                            <TableCell>
                                                <Link href={`/dashboard/parties/${p.id}`} className="text-rose-400 hover:underline text-sm font-medium">{p.name}</Link>
                                            </TableCell>
                                            <TableCell className="text-rose-400 font-mono font-bold">{formatCurrency(p.total)}</TableCell>
                                            <TableCell className="text-emerald-400 font-mono text-sm">{p.b0 > 0 ? formatCurrency(p.b0) : "—"}</TableCell>
                                            <TableCell className="text-amber-400 font-mono text-sm">{p.b30 > 0 ? formatCurrency(p.b30) : "—"}</TableCell>
                                            <TableCell className="text-orange-400 font-mono text-sm">{p.b60 > 0 ? formatCurrency(p.b60) : "—"}</TableCell>
                                            <TableCell className="text-rose-400 font-mono text-sm">{p.b90 > 0 ? formatCurrency(p.b90) : "—"}</TableCell>
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
