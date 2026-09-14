"use client"

import { useMemo, useState } from "react"
import { format, startOfDay, subDays } from "date-fns"
import { Dialog as DialogPrimitive } from "radix-ui"
import { pdf } from "@react-pdf/renderer"
import { toast } from "sonner"
import { ChevronLeft, Download, Loader2, Receipt } from "lucide-react"
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
import { cn } from "@/lib/utils"

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

    return (
        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
            <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay
                    className="fixed inset-0 z-50 bg-black/50 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
                />
                <DialogPrimitive.Content
                    data-slot="dialog-content"
                    className="fixed inset-0 z-50 bg-background flex flex-col outline-none data-open:animate-in data-open:slide-in-from-bottom-4 data-open:duration-250 data-closed:animate-out data-closed:slide-out-to-bottom-2 data-closed:duration-150"
                >
                    <DialogPrimitive.Title className="sr-only">Report of {party.name}</DialogPrimitive.Title>
                    <ReportBody party={party} transactions={transactions} onClose={() => setOpen(false)} />
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}

function ReportBody({
    party,
    transactions,
    onClose,
}: {
    party: { id: string; name: string }
    transactions: SupplierTransactionWithBalance[]
    onClose: () => void
}) {
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
        <>
            <div
                className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0"
                style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 -ml-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Close report"
                >
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-foreground truncate">Report of {party.name}</h1>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-2xl px-4 py-5 space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">Start Date</label>
                            <Input
                                type="date"
                                value={fromDateStr}
                                onChange={(e) => {
                                    setFromDateStr(e.target.value)
                                    setPreset("custom")
                                }}
                                className="bg-card border-border text-foreground"
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
                                className="bg-card border-border text-foreground"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Input
                            placeholder="Search Entries"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-card border-border text-foreground flex-1"
                        />
                        <Select value={preset} onValueChange={(v) => applyPreset(v as ReportPreset)}>
                            <SelectTrigger className="w-[140px] bg-card border-border">
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

                    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                        <span className="text-sm font-medium text-muted-foreground">Net Balance</span>
                        <span className={cn("text-lg font-bold", isGet ? "text-emerald-500" : "text-rose-500")}>
                            ₹{Math.abs(netBalance).toLocaleString("en-IN")}
                        </span>
                    </div>

                    <div className="flex items-center justify-between border-y border-border py-3">
                        <div>
                            <p className="text-sm font-semibold text-foreground">Total</p>
                            <p className="text-xs text-muted-foreground">{filtered.length} Entries</p>
                        </div>
                        <div className="flex gap-5">
                            <div className="text-center">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase">You Gave</p>
                                <p className="text-sm font-bold text-rose-500">₹{totalGave.toLocaleString("en-IN")}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase">You Got</p>
                                <p className="text-sm font-bold text-emerald-500">₹{totalGot.toLocaleString("en-IN")}</p>
                            </div>
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="py-14 text-center space-y-3">
                            <Receipt size={28} className="mx-auto text-muted-foreground/50" />
                            <p className="text-muted-foreground text-sm">No entries in this range</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {[...filtered].reverse().map((t) => {
                                const balPositive = t.runningBalance > 0
                                const balColor =
                                    t.runningBalance === 0
                                        ? "text-muted-foreground"
                                        : balPositive
                                        ? "text-emerald-500"
                                        : "text-rose-500"
                                return (
                                    <div
                                        key={t.id}
                                        className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-3"
                                    >
                                        <div className="min-w-0 space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-xs text-muted-foreground">
                                                    {format(t.date, "d MMM yy")}
                                                </p>
                                                <span
                                                    className={cn(
                                                        "text-[10px] font-semibold px-1.5 py-0.5 rounded bg-current/10",
                                                        balColor
                                                    )}
                                                >
                                                    Bal. ₹{Math.abs(t.runningBalance).toLocaleString("en-IN")}
                                                </span>
                                                {t.paymentMode && (
                                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                        {t.paymentMode === "CASH" ? "Cash" : "Online"}
                                                    </span>
                                                )}
                                            </div>
                                            {t.details && <p className="text-sm text-foreground">{t.details}</p>}
                                        </div>
                                        <span
                                            className={cn(
                                                "text-base font-bold shrink-0",
                                                t.type === "GAVE" ? "text-rose-500" : "text-emerald-500"
                                            )}
                                        >
                                            ₹{t.amount.toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div
                className="border-t border-border p-4 shrink-0"
                style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
            >
                <Button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="mx-auto flex w-full max-w-2xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold gap-2"
                >
                    {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    {downloading ? "Generating..." : "Download"}
                </Button>
            </div>
        </>
    )
}
