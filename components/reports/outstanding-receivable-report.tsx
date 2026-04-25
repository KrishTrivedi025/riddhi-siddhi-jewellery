"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getOutstandingReceivableReport } from "@/lib/actions/reports"
import { ReportShell } from "./report-shell"
import { formatCurrency } from "@/lib/gst-utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type ReportData = Awaited<ReturnType<typeof getOutstandingReceivableReport>>

export function OutstandingReceivableReport() {
    const [data, setData] = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(true)
    useEffect(() => { getOutstandingReceivableReport().then(d => { setData(d); setLoading(false) }) }, [])

    return (
        <ReportShell title="Outstanding Receivable" description="Money owed to you by customers" icon="📥" accentColor="#22C55E" showDateFilter={false}>
            {loading && <div className="h-64 bg-card rounded-2xl border border-border animate-pulse"/>}
            {!loading && data && (
                <div className="space-y-4">
                    {/* Aging Buckets */}
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

                    {/* Grand total */}
                    <div className="flex items-center justify-between px-5 py-3 bg-primary/5 border border-primary/20 rounded-xl">
                        <span className="text-sm font-bold text-foreground">Total Outstanding Receivable</span>
                        <span className="text-xl font-black text-primary font-mono">{formatCurrency(data.grandTotal)}</span>
                    </div>

                    {/* Party breakdown */}
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        {["Party","Total Due","0–30","31–60","61–90","90+"].map(h => (
                                            <TableHead key={h} className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.parties.length === 0 && (
                                        <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">🎉 No outstanding receivables!</TableCell></TableRow>
                                    )}
                                    {data.parties.map(p => (
                                        <TableRow key={p.id} className="border-border hover:bg-background/60">
                                            <TableCell>
                                                <Link href={`/dashboard/parties/${p.id}`} className="text-primary hover:underline text-sm font-medium">{p.name}</Link>
                                            </TableCell>
                                            <TableCell className="text-emerald-400 font-mono font-bold">{formatCurrency(p.total)}</TableCell>
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
