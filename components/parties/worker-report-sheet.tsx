"use client"

import { useEffect, useState } from "react"
import { addMonths, endOfMonth, format, isSameMonth, subMonths } from "date-fns"
import { Dialog as DialogPrimitive } from "radix-ui"
import { pdf } from "@react-pdf/renderer"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Download, Loader2, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { downloadOrSharePdf, buildShareFilename, describeSharePdfResult } from "@/lib/pdf-download"
import { SupplierStatementDocument } from "./supplier-statement-pdf"
import { getWorkerLedger, type WorkerLedgerSummary } from "@/lib/actions/workers"
import type { SupplierTransactionWithBalance } from "@/lib/actions/supplier-transactions"
import { cn } from "@/lib/utils"

interface WorkerReportSheetProps {
    party: { id: string; name: string }
    trigger: React.ReactNode
}

export function WorkerReportSheet({ party, trigger }: WorkerReportSheetProps) {
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
                    <ReportBody party={party} open={open} onClose={() => setOpen(false)} />
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}

function ReportBody({
    party,
    open,
    onClose,
}: {
    party: { id: string; name: string }
    open: boolean
    onClose: () => void
}) {
    // Starts unresolved rather than computed from the browser's own `new Date()` —
    // the client (IST) and server (UTC on Vercel) disagree on "the current month" for
    // part of every day, so the server resolves it (see lib/date-utils.ts) and the
    // client adopts that answer once. Every later navigation offsets from that
    // server-confirmed anchor, which stays safe to manipulate locally.
    const [month, setMonth] = useState<Date | null>(null)
    const [summary, setSummary] = useState<WorkerLedgerSummary | null>(null)
    const [transactions, setTransactions] = useState<SupplierTransactionWithBalance[]>([])
    const [loading, setLoading] = useState(false)
    const [downloading, setDownloading] = useState(false)

    useEffect(() => {
        if (!open) return
        let cancelled = false
        setLoading(true)
        getWorkerLedger(party.id, month ?? undefined)
            .then((result) => {
                if (cancelled) return
                setSummary(result.summary)
                setTransactions(result.transactions)
                setMonth((prev) => prev ?? new Date(`${result.summary.month}-01T00:00:00.000Z`))
            })
            .catch(() => {
                if (!cancelled) toast.error("Failed to load report")
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [open, month, party.id])

    const isGet = (summary?.netBalance ?? 0) > 0
    const isCurrentMonth = month ? isSameMonth(month, new Date()) : true

    const handleDownload = async () => {
        if (!summary || !month) return
        setDownloading(true)
        try {
            const doc = (
                <SupplierStatementDocument
                    businessName="Riddhi Siddhi Jewellery"
                    partyName={party.name}
                    transactions={transactions}
                    openingBalance={0}
                    netBalance={summary.netBalance}
                    fromDate={month}
                    toDate={endOfMonth(month)}
                    generatedAt={new Date()}
                />
            )
            const blob = await pdf(doc).toBlob()
            const filename = buildShareFilename(party.name, "worker_report")
            const result = await downloadOrSharePdf(blob, filename)
            const diag = describeSharePdfResult(result)
            if (diag) {
                if (diag.type === "error") toast.error(diag.message)
                else toast.info(diag.message)
            }
        } catch (err) {
            console.error("Worker report PDF error:", err)
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
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setMonth((m) => (m ? subMonths(m, 1) : m))}
                            disabled={!month}
                            className="p-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Previous month"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <p className="text-sm font-semibold text-foreground">
                            {month ? format(month, "MMMM yyyy") : " "}
                        </p>
                        <button
                            type="button"
                            onClick={() => setMonth((m) => (m ? addMonths(m, 1) : m))}
                            disabled={!month || isCurrentMonth}
                            className="p-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Next month"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {loading || !summary ? (
                        <div className="py-14 text-center text-sm text-muted-foreground">Loading…</div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                                <span className="text-sm font-medium text-muted-foreground">Net Balance</span>
                                <span className={cn("text-lg font-bold", isGet ? "text-emerald-500" : "text-rose-500")}>
                                    ₹{Math.abs(summary.netBalance).toLocaleString("en-IN")}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border border-border p-3">
                                    <p className="text-xs text-muted-foreground">Monthly Salary</p>
                                    <p className="text-sm font-semibold text-foreground mt-0.5">
                                        ₹{summary.monthlySalary.toLocaleString("en-IN")}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-border p-3">
                                    <p className="text-xs text-muted-foreground">Absent Days</p>
                                    <p className="text-sm font-semibold text-foreground mt-0.5">
                                        {summary.absentDays} (−₹{summary.totalAbsentDeduction.toLocaleString("en-IN")})
                                    </p>
                                    {summary.halfDays > 0 && (
                                        <p className="text-xs text-amber-500 mt-0.5">{summary.halfDays} half day{summary.halfDays > 1 ? "s" : ""}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-y border-border py-3">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Total</p>
                                    <p className="text-xs text-muted-foreground">{transactions.length} Entries</p>
                                </div>
                                <div className="flex gap-5">
                                    <div className="text-center">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase">You Gave</p>
                                        <p className="text-sm font-bold text-rose-500">
                                            ₹{summary.totalGave.toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase">You Got</p>
                                        <p className="text-sm font-bold text-emerald-500">
                                            ₹{summary.totalGot.toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {transactions.length === 0 ? (
                                <div className="py-14 text-center space-y-3">
                                    <Receipt size={28} className="mx-auto text-muted-foreground/50" />
                                    <p className="text-muted-foreground text-sm">No entries this month</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {transactions.map((t) => {
                                        const balPositive = t.runningBalance > 0
                                        const balColor =
                                            t.runningBalance === 0
                                                ? "text-muted-foreground"
                                                : balPositive
                                                ? "text-emerald-500"
                                                : "text-rose-500"
                                        const isAbsent = t.type === "ABSENT"
                                        const isHalfDay = t.type === "HALF_DAY"
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
                                                    <p className="text-sm text-foreground">{t.details || ""}</p>
                                                </div>
                                                <span
                                                    className={cn(
                                                        "text-base font-bold shrink-0",
                                                        isAbsent
                                                            ? "text-muted-foreground"
                                                            : isHalfDay
                                                            ? "text-amber-500"
                                                            : t.type === "GAVE"
                                                            ? "text-rose-500"
                                                            : "text-emerald-500"
                                                    )}
                                                >
                                                    {isAbsent || isHalfDay ? "−" : ""}₹{t.amount.toLocaleString("en-IN")}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div
                className="border-t border-border p-4 shrink-0"
                style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
            >
                <Button
                    onClick={handleDownload}
                    disabled={downloading || loading || !summary}
                    className="mx-auto flex w-full max-w-2xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold gap-2"
                >
                    {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    {downloading ? "Generating..." : "Download"}
                </Button>
            </div>
        </>
    )
}
