"use client"

import { useMemo, useState } from "react"
import { format, startOfDay, subDays } from "date-fns"
import { pdf } from "@react-pdf/renderer"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Download, FileText, Loader2 } from "lucide-react"
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
import { SupplierListReportDocument } from "./supplier-list-report-pdf"
import { SupplierTransactionsReportDocument } from "./supplier-transactions-report-pdf"
import { getAllSupplierTransactions } from "@/lib/actions/supplier-transactions"
import type { AllSupplierTransactionRow, SupplierKhataSummary } from "@/lib/actions/supplier-transactions"

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

interface SupplierListReportDialogProps {
    summary: SupplierKhataSummary
    trigger: React.ReactNode
}

export function SupplierListReportDialog({ summary, trigger }: SupplierListReportDialogProps) {
    const [open, setOpen] = useState(false)
    const [view, setView] = useState<"menu" | "transactions">("menu")
    const [allTransactions, setAllTransactions] = useState<AllSupplierTransactionRow[] | null>(null)
    const [loadingTransactions, setLoadingTransactions] = useState(false)
    const [downloadingList, setDownloadingList] = useState(false)
    const [downloadingTransactions, setDownloadingTransactions] = useState(false)

    const [preset, setPreset] = useState<ReportPreset>("all")
    const [fromDateStr, setFromDateStr] = useState("")
    const [toDateStr, setToDateStr] = useState("")
    const [search, setSearch] = useState("")

    const openTransactionsView = async () => {
        setView("transactions")
        if (allTransactions !== null) return
        setLoadingTransactions(true)
        try {
            const rows = await getAllSupplierTransactions()
            setAllTransactions(rows)
        } catch {
            toast.error("Failed to load transactions")
        } finally {
            setLoadingTransactions(false)
        }
    }

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
        let list = allTransactions || []
        if (from) list = list.filter((t) => t.date >= from)
        if (to) {
            const end = new Date(to)
            end.setHours(23, 59, 59, 999)
            list = list.filter((t) => t.date <= end)
        }
        if (search) {
            const q = search.toLowerCase()
            list = list.filter(
                (t) =>
                    (t.details || "").toLowerCase().includes(q) ||
                    String(t.amount).includes(q) ||
                    t.partyName.toLowerCase().includes(q)
            )
        }
        return list
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allTransactions, fromDateStr, toDateStr, search])

    const totalGave = filtered.reduce((s, t) => s + (t.type === "GAVE" ? t.amount : 0), 0)
    const totalGot = filtered.reduce((s, t) => s + (t.type === "GOT" ? t.amount : 0), 0)
    const netBalance = totalGave - totalGot
    const isGet = netBalance >= 0

    const handleDownloadList = async () => {
        setDownloadingList(true)
        try {
            const doc = (
                <SupplierListReportDocument
                    businessName="Riddhi Siddhi Jewellery"
                    suppliers={summary.suppliers}
                    totalWillGive={summary.totalWillGive}
                    totalWillGet={summary.totalWillGet}
                    generatedAt={new Date()}
                />
            )
            const blob = await pdf(doc).toBlob()
            const filename = `Supplier_List_Report_${format(new Date(), "dd-MM-yyyy")}.pdf`
            const result = await downloadOrSharePdf(blob, filename)
            const diag = describeSharePdfResult(result)
            if (diag) {
                if (diag.type === "error") toast.error(diag.message)
                else toast.info(diag.message)
            } else {
                setOpen(false)
            }
        } catch (err) {
            console.error("Supplier list PDF error:", err)
            toast.error("Failed to generate PDF")
        } finally {
            setDownloadingList(false)
        }
    }

    const handleDownloadTransactions = async () => {
        setDownloadingTransactions(true)
        try {
            const doc = (
                <SupplierTransactionsReportDocument
                    businessName="Riddhi Siddhi Jewellery"
                    transactions={filtered}
                    fromDate={from}
                    toDate={to}
                    generatedAt={new Date()}
                />
            )
            const blob = await pdf(doc).toBlob()
            const filename = buildShareFilename("Supplier", "Transaction_Report")
            const result = await downloadOrSharePdf(blob, filename)
            const diag = describeSharePdfResult(result)
            if (diag) {
                if (diag.type === "error") toast.error(diag.message)
                else toast.info(diag.message)
            }
        } catch (err) {
            console.error("Supplier transactions report PDF error:", err)
            toast.error("Failed to generate PDF")
        } finally {
            setDownloadingTransactions(false)
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next)
                if (!next) setView("menu")
            }}
        >
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground w-[95vw] max-w-lg rounded-2xl p-0 overflow-hidden gap-0">
                {view === "menu" ? (
                    <>
                        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
                            <DialogTitle className="text-lg font-bold">Reports</DialogTitle>
                        </DialogHeader>
                        <div className="p-2">
                            <button
                                type="button"
                                onClick={openTransactionsView}
                                className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-muted transition-colors text-left"
                            >
                                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <FileText size={18} className="text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground">Supplier Transactions Report</p>
                                    <p className="text-xs text-muted-foreground">Summary of all supplier transactions</p>
                                </div>
                                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                            </button>
                            <button
                                type="button"
                                onClick={handleDownloadList}
                                disabled={downloadingList}
                                className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-muted transition-colors text-left disabled:opacity-60"
                            >
                                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    {downloadingList ? (
                                        <Loader2 size={18} className="text-primary animate-spin" />
                                    ) : (
                                        <Download size={18} className="text-primary" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground">Supplier list pdf</p>
                                    <p className="text-xs text-muted-foreground">List of all Suppliers</p>
                                </div>
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border flex-row items-center gap-2 space-y-0">
                            <button
                                type="button"
                                onClick={() => setView("menu")}
                                className="p-1 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <DialogTitle className="text-lg font-bold">View Report</DialogTitle>
                        </DialogHeader>

                        <div className="overflow-y-auto max-h-[65vh] px-5 py-4 space-y-4">
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

                            {loadingTransactions ? (
                                <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
                            ) : (
                                <>
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
                                            {filtered.map((t) => (
                                                <div key={t.id} className="flex items-center justify-between gap-2 text-sm border-b border-border pb-2">
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-muted-foreground">
                                                            {t.partyName} • {format(t.date, "d MMM yy")}
                                                        </p>
                                                        {t.details && <p className="text-foreground truncate">{t.details}</p>}
                                                    </div>
                                                    <span className={`font-semibold shrink-0 ${t.type === "GAVE" ? "text-rose-500" : "text-emerald-500"}`}>
                                                        ₹{t.amount.toLocaleString("en-IN")}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="border-t border-border p-4">
                            <Button
                                onClick={handleDownloadTransactions}
                                disabled={downloadingTransactions || loadingTransactions}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
                            >
                                {downloadingTransactions ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Download size={16} />
                                )}
                                {downloadingTransactions ? "Generating..." : "Download"}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
