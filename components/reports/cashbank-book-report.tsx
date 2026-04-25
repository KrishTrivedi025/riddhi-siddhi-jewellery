"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { getCashBankBookReport, getBankAccountsForReports } from "@/lib/actions/reports"
import { ReportShell, presetToRange, type DatePreset } from "./report-shell"
import { formatCurrency } from "@/lib/gst-utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type ReportData   = Awaited<ReturnType<typeof getCashBankBookReport>>
type AccountsList = Awaited<ReturnType<typeof getBankAccountsForReports>>

const TYPE_BADGE: Record<string, string> = {
    "Payment In":   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Payment Out":  "bg-orange-500/10 text-orange-400 border-orange-500/20",
    "Transfer In":  "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Transfer Out": "bg-violet-500/10 text-violet-400 border-violet-500/20",
    "Expense":      "bg-rose-500/10 text-rose-400 border-rose-500/20",
}

export function CashBankBookReport() {
    const [data,     setData]     = useState<ReportData | null>(null)
    const [accounts, setAccounts] = useState<AccountsList>([])
    const [loading,  setLoading]  = useState(true)
    const [preset,   setPreset]   = useState<DatePreset>("this_month")
    const [acctId,   setAcctId]   = useState("")

    async function load(p: DatePreset, aid: string) {
        if (!aid) return
        setLoading(true)
        const d = await getCashBankBookReport(presetToRange(p), aid)
        setData(d); setLoading(false)
    }

    useEffect(() => {
        getBankAccountsForReports().then(list => {
            setAccounts(list)
            if (list.length > 0) { setAcctId(list[0].id); load(preset, list[0].id) }
            else setLoading(false)
        })
    }, [])

    return (
        <ReportShell title="Cash / Bank Book" description="Ledger for a specific account" icon="🏦" accentColor="#3B82F6"
            preset={preset} onPresetChange={(p) => { setPreset(p); load(p, acctId) }}>
            {/* Account selector */}
            <div className="mb-4 flex items-center gap-3">
                <label className="text-xs text-muted-foreground font-medium">Account</label>
                <Select value={acctId} onValueChange={v => { setAcctId(v); load(preset, v) }}>
                    <SelectTrigger className="h-8 w-56 text-xs bg-background border-border text-foreground">
                        <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                        {accounts.map(a => (
                            <SelectItem key={a.id} value={a.id} className="text-xs text-foreground focus:bg-primary/10 focus:text-primary">
                                {a.isCash ? "💵" : "🏦"} {a.accountName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {loading && <div className="h-64 bg-card rounded-2xl border border-border animate-pulse"/>}
            {accounts.length === 0 && !loading && (
                <div className="text-center py-16 text-muted-foreground text-sm">No accounts found. Add bank or cash accounts first.</div>
            )}
            {!loading && data && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-card border border-border rounded-xl p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Opening Balance</p>
                            <p className="text-lg font-bold font-mono text-primary">{formatCurrency(data.account.openingBalance)}</p>
                        </div>
                        <div className="bg-card border border-emerald-500/20 rounded-xl p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Credits</p>
                            <p className="text-lg font-bold font-mono text-emerald-400">+{formatCurrency(data.totalCredit)}</p>
                        </div>
                        <div className="bg-card border border-rose-500/20 rounded-xl p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Debits</p>
                            <p className="text-lg font-bold font-mono text-rose-400">−{formatCurrency(data.totalDebit)}</p>
                        </div>
                    </div>

                    {/* Closing balance */}
                    <div className="flex items-center justify-between px-5 py-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                        <span className="text-sm font-bold text-foreground">Closing Balance (period)</span>
                        <span className={cn("text-xl font-black font-mono", data.closingBalance >= 0 ? "text-blue-400" : "text-rose-400")}>{formatCurrency(Math.abs(data.closingBalance))}</span>
                    </div>

                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        {["Date","Type","Description","Reference","Debit","Credit","Balance"].map(h => (
                                            <TableHead key={h} className="text-muted-foreground text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.entries.length === 0 && (
                                        <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">No transactions in this period</TableCell></TableRow>
                                    )}
                                    {data.entries.map((e, i) => (
                                        <TableRow key={i} className="border-border hover:bg-background/60">
                                            <TableCell className="text-muted-foreground text-xs font-mono whitespace-nowrap">{format(new Date(e.date), "dd MMM yy")}</TableCell>
                                            <TableCell>
                                                <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap", TYPE_BADGE[e.type] || "bg-border text-muted-foreground border-border")}>
                                                    {e.type}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-foreground text-xs max-w-[160px] truncate">{e.description}</TableCell>
                                            <TableCell className="text-muted-foreground text-xs font-mono">{e.reference}</TableCell>
                                            <TableCell className="text-rose-400 font-mono text-sm">{e.debit > 0 ? formatCurrency(e.debit) : "—"}</TableCell>
                                            <TableCell className="text-emerald-400 font-mono text-sm">{e.credit > 0 ? formatCurrency(e.credit) : "—"}</TableCell>
                                            <TableCell className={cn("font-mono text-sm font-bold", e.balance >= 0 ? "text-blue-400" : "text-rose-400")}>
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
