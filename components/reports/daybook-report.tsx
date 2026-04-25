"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { getDayBookReport } from "@/lib/actions/reports"
import { ReportShell } from "./report-shell"
import { formatCurrency } from "@/lib/gst-utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ReportData = Awaited<ReturnType<typeof getDayBookReport>>

const BADGE: Record<string, string> = {
    sale:        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    purchase:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
    payment_in:  "bg-primary/10 text-primary border-primary/20",
    payment_out: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    expense:     "bg-rose-500/10 text-rose-400 border-rose-500/20",
}

export function DayBookReport() {
    const [data, setData]     = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(true)
    const [date, setDate]     = useState(() => format(new Date(), "yyyy-MM-dd"))

    async function load(d: string) {
        setLoading(true)
        const result = await getDayBookReport(new Date(d))
        setData(result); setLoading(false)
    }
    useEffect(() => { load(date) }, [])

    return (
        <ReportShell title="Day Book" description="All transactions for a selected date" icon="📖" accentColor="#D4A017" showDateFilter={false}>
            {/* Date picker */}
            <div className="mb-4 flex items-center gap-3">
                <label className="text-xs text-muted-foreground font-medium">Date</label>
                <Input
                    type="date"
                    value={date}
                    onChange={e => { setDate(e.target.value); load(e.target.value) }}
                    className="h-8 w-44 text-xs bg-background border-border text-foreground"
                />
            </div>

            {loading && <div className="h-64 bg-card rounded-2xl border border-border animate-pulse"/>}
            {!loading && data && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-card border border-border rounded-xl p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Entries</p>
                            <p className="text-lg font-bold font-mono text-foreground">{data.entries.length}</p>
                        </div>
                        <div className="bg-card border border-emerald-500/20 rounded-xl p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Credit</p>
                            <p className="text-lg font-bold font-mono text-emerald-400">{formatCurrency(data.totalCredit)}</p>
                        </div>
                        <div className="bg-card border border-rose-500/20 rounded-xl p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Debit</p>
                            <p className="text-lg font-bold font-mono text-rose-400">{formatCurrency(data.totalDebit)}</p>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        {["Time","Type","Reference","Party / Description","Debit","Credit","Balance"].map(h => (
                                            <TableHead key={h} className="text-muted-foreground text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.entries.length === 0 && (
                                        <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">No transactions on this date</TableCell></TableRow>
                                    )}
                                    {data.entries.map((e, i) => (
                                        <TableRow key={i} className="border-border hover:bg-background/60">
                                            <TableCell className="text-muted-foreground text-xs font-mono">{format(new Date(e.date), "HH:mm")}</TableCell>
                                            <TableCell>
                                                <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap", BADGE[e.badge] || "bg-border text-muted-foreground border-border")}>
                                                    {e.type}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs font-mono">{e.reference}</TableCell>
                                            <TableCell className="text-foreground text-xs max-w-[180px] truncate">{e.description}</TableCell>
                                            <TableCell className="text-rose-400 font-mono text-sm">{e.debit > 0 ? formatCurrency(e.debit) : "—"}</TableCell>
                                            <TableCell className="text-emerald-400 font-mono text-sm">{e.credit > 0 ? formatCurrency(e.credit) : "—"}</TableCell>
                                            <TableCell className={cn("font-mono text-sm font-bold", e.balance >= 0 ? "text-primary" : "text-rose-400")}>
                                                {formatCurrency(Math.abs(e.balance))}{e.balance < 0 ? " Dr" : " Cr"}
                                            </TableCell>
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
