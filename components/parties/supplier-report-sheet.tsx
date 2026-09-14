"use client"

import { useMemo, useState } from "react"
import { format, startOfDay, subDays } from "date-fns"
import { pdf } from "@react-pdf/renderer"
import { toast } from "sonner"
import { Download, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { downloadOrSharePdf, buildShareFilename, describeSharePdfResult } from "@/lib/pdf-download"
import { SupplierStatementDocument } from "./supplier-statement-pdf"
import type { SupplierTransactionWithBalance } from "@/lib/actions/supplier-transactions"

type ReportPreset = "all" | "today" | "week" | "month" | "custom"

function getPresetRange(preset: ReportPreset): { from?: Date; to?: Date } {
    const today = new Date()
    switch (preset) {
        case "today":
            return { from: startOfDay(today), to: today }
        case "week":
            return { from: startOfDay(subDays(today, 6)), to: today }
        case "month":
            return { from: startOfDay(subDays(today, 29)), to: today }
        default:
            return {}
    }
}

interface SupplierReportSheetProps {
    party: { id: string; name: string }
    transactions: SupplierTransactionWithBalance[] // full, unfiltered, newest-first
    trigger: React.ReactNode
}

export function SupplierReportSheet({ party, transactions, trigger }: SupplierReportSheetProps) {
    const [open, setOpen] = useState(false)
    const [preset, setPreset] = useState<ReportPreset>("all")
    const [fromDateStr, setFromDateStr] = useState("")
    const [toDateStr, setToDateStr] = useState("")
    const [search, setSearch] = useState("")
    const [downloading, setDownloading] = useState(false)

    const chronological = useMemo(() => [...transactions].reverse(), [transactions])

    const applyPreset = (value: ReportPreset) => {
        setPreset(value)
        if (value === "custom") return
        const range = getPresetRange(value)
        setFromDateStr(range.from ? format(range.from, "yyyy-MM-dd") : "")
        setToDateStr(range.to ? format(range.to, "yyyy-MM-dd") : "")
    }

    const from = fromDateStr ? new Date(fromDateStr) : undefined
    const to = toDateStr ? new Date(toDateStr) : undefined

    const filtered = useMemo(() => {
        let list = chronological
        if (from) list = list.filter((t) => t.date >= from)
        if (to) {
            const end = new Date(to)
            end.setHours(23, 59, 59, 999)
            list = list.filter((t) => t.date <= end)
        }
        if (search) {
            const q = search.toLowerCase()
            list = list.filter(
                (t) => (t.details || "").toLowerCase().includes(q) || String(t.amount).includes(q)
            )
        }
        return list
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chronological, fromDateStr, toDateStr, search])

    const openingBalance =
        filtered.length > 0
            ? filtered[0].runningBalance - (filtered[0].type === "GAVE" ? filtered[0].amount : -filtered[0].amount)
            : chronological.length > 0
            ? chronological[chronological.length - 1].runningBalance
            : 0

    const totalGave = filtered.reduce((s, t) => s + (t.type === "GAVE" ? t.amount : 0), 0)
    const totalGot = filtered.reduce((s, t) => s + (t.type === "GOT" ? t.amount : 0), 0)
    const netBalance = filtered.length > 0 ? filtered[filtered.length - 1].runningBalance : openingBalance
    const isGet = netBalance > 0

    const handleDownload = async () => {
        setDownloading(true)
        try {
            const doc = (
                <SupplierStatementDocument
                    businessName="Riddhi Siddhi Jewellery"
                    partyName={party.name}
                    transactions={filtered}
                    openingBalance={openingBalance}
                    fromDate={from}
                    toDate={to}
                    generatedAt={new Date()}
                />
            )
            const blob = await pdf(doc).toBlob()
            const filename = buildShareFilename(party.name, "supplier_report")
            const result = await downloadOrSharePdf(blob, filename)
            const diag = describeSharePdfResult(result)
            if (diag) {
                if (diag.type === "error") toast.error(diag.message)
                else toast.info(diag.message)
            }
        } catch (err) {
            console.error("Supplier report PDF error:", err)
            toast.error("Failed to generate PDF")
        } finally {
            setDownloading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground w-[95vw] max-w-lg rounded-2xl p-0 overflow-hidden gap-0">
                <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
                    <DialogTitle className="text-lg font-bold">Report of {party.name}</DialogTitle>
                </DialogHeader>

                <div className="overflow-y-auto max-h-[70vh] px-5 py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">Start Date</label>
                            <Input
                                type="date"
                                value={fromDateStr}
                                onChange={(e) => {
                                    setFromDateStr(e.target.value)
                                    setPreset("custom")
                                }}
                                className="bg-background border-border text-foreground"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">End Date</label>
                            <Input
                                type="date"
                                value={toDateStr}
                                onChange={(e) => {
                                    setToDateStr(e.target.value)
                                    setPreset("custom")
                                }}
                                className="bg-background border-border text-foreground"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Input
                            placeholder="Search Entries"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-background border-border text-foreground flex-1"
                        />
                        <Select value={preset} onValueChange={(v) => applyPreset(v as ReportPreset)}>
                            <SelectTrigger className="w-[130px] bg-background border-border">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="today">Single day</SelectItem>
                                <SelectItem value="week">Last week</SelectItem>
                                <SelectItem value="month">Last month</SelectItem>
                                <SelectItem value="custom">Custom Range</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <span className="text-sm font-semibold text-foreground">Net Balance</span>
                        <span className={`text-lg font-bold ${isGet ? "text-emerald-500" : "text-rose-500"}`}>
                            ₹{Math.abs(netBalance).toLocaleString("en-IN")}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-b border-border py-2">
                        <span>Total: {filtered.length} Entries</span>
                        <div className="flex gap-4">
                            <span className="text-rose-500 font-semibold">₹{totalGave.toLocaleString("en-IN")}</span>
                            <span className="text-emerald-500 font-semibold">₹{totalGot.toLocaleString("en-IN")}</span>
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground italic py-6">No entries in this range</p>
                    ) : (
                        <div className="space-y-2">
                            {[...filtered].reverse().map((t) => (
                                <div key={t.id} className="flex items-center justify-between gap-2 text-sm border-b border-border pb-2">
                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground">{format(t.date, "d MMM yy")}</p>
                                        {t.details && <p className="text-foreground truncate">{t.details}</p>}
                                    </div>
                                    <span className={`font-semibold shrink-0 ${t.type === "GAVE" ? "text-rose-500" : "text-emerald-500"}`}>
                                        ₹{t.amount.toLocaleString("en-IN")}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t border-border p-4">
                    <Button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
                    >
                        {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        {downloading ? "Generating..." : "Download"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
