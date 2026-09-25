"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { isSameMonth, startOfMonth, format } from "date-fns"
import { toast } from "sonner"
import { FileText } from "lucide-react"
import { Fab } from "@/components/shared/fab"
import { WorkerAttendanceCalendar } from "./worker-attendance-calendar"
import { WorkerRateDialog } from "./worker-rate-dialog"
import { SupplierTransactionList } from "./supplier-transaction-list"
import { SupplierTransactionForm } from "./supplier-transaction-form"
import { SupplierTransactionSuccess } from "./supplier-transaction-success"
import { WorkerReportSheet } from "./worker-report-sheet"
import { getWorkerLedger, setWorkerAttendance, type WorkerDayStatus, type WorkerLedgerResult } from "@/lib/actions/workers"
import type { SupplierTransactionType, SupplierTransactionWithBalance } from "@/lib/actions/supplier-transactions"
import { cn } from "@/lib/utils"

interface WorkerKhataDetailProps {
    party: { id: string; name: string; phone: string | null }
    transactions: SupplierTransactionWithBalance[]
    summary: WorkerLedgerResult["summary"]
}

export function WorkerKhataDetail({ party, transactions, summary }: WorkerKhataDetailProps) {
    const router = useRouter()
    const [formOpen, setFormOpen] = useState(false)
    const [formType, setFormType] = useState<SupplierTransactionType>("GAVE")
    const [editing, setEditing] = useState<SupplierTransactionWithBalance | null>(null)
    const [success, setSuccess] = useState<{ amount: number } | null>(null)
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [savingDate, setSavingDate] = useState<string | null>(null)

    // The calendar/ledger is now navigable to any past month, so the current month's
    // data (given as props from the server page, which only ever renders the current
    // month) is just this component's *initial* state — everything after that, including
    // re-syncing the current month after a save, is fetched here client-side, the same
    // way WorkerReportSheet already fetches whichever month it's showing.
    const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()))
    const [ledger, setLedger] = useState<WorkerLedgerResult>({ transactions, summary })
    const [dayStatus, setDayStatus] = useState<Record<string, WorkerDayStatus>>(summary.dayStatus)
    const [loadingMonth, setLoadingMonth] = useState(false)
    const isFirstRender = useRef(true)

    const refetch = async (targetMonth: Date) => {
        setLoadingMonth(true)
        try {
            const result = await getWorkerLedger(party.id, targetMonth)
            setLedger(result)
            setDayStatus(result.summary.dayStatus)
        } catch {
            toast.error("Failed to load that month")
        } finally {
            setLoadingMonth(false)
        }
    }

    // Skip the fetch on mount — the server page already gave us the current month.
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        setSelectedDate(null)
        refetch(month)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [month])

    const handleMonthChange = (next: Date) => setMonth(startOfMonth(next))

    const handleSelectDate = (dateStr: string) => {
        setSelectedDate((prev) => (prev === dateStr ? null : dateStr))
    }

    const handleSetDayStatus = async (dateStr: string, status: WorkerDayStatus | "PRESENT") => {
        const previous = dayStatus
        const next: Record<string, WorkerDayStatus> = { ...dayStatus }
        if (status === "PRESENT") delete next[dateStr]
        else next[dateStr] = status
        setDayStatus(next)
        setSavingDate(dateStr)
        try {
            const result = await setWorkerAttendance(party.id, month, next)
            if (result.success) {
                toast.success(
                    status === "PRESENT" ? "Marked present" : status === "HALF_DAY" ? "Marked half day" : "Marked absent"
                )
                await refetch(month)
                router.refresh()
            } else {
                setDayStatus(previous)
                toast.error(result.error)
            }
        } catch {
            setDayStatus(previous)
            toast.error("Failed to update attendance")
        } finally {
            setSavingDate(null)
        }
    }

    const openForm = (type: SupplierTransactionType, editTransaction?: SupplierTransactionWithBalance) => {
        setFormType(type)
        setEditing(editTransaction ?? null)
        setFormOpen(true)
    }

    const handleSaved = async ({ amount, isEdit }: { type: SupplierTransactionType; amount: number; isEdit: boolean }) => {
        setFormOpen(false)
        setEditing(null)
        await refetch(month)
        router.refresh()
        if (isEdit) {
            toast.success("Entry updated")
        } else {
            setSuccess({ amount })
        }
    }

    const handleAddAnother = (type: SupplierTransactionType) => {
        setSuccess(null)
        openForm(type)
    }

    const { transactions: viewTransactions, summary: viewSummary } = ledger
    const isGet = viewSummary.netBalance > 0
    const isCurrentMonth = isSameMonth(month, new Date())

    return (
        <div className="space-y-4 pb-40 md:pb-8">
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-foreground truncate">{party.name}</p>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                                Worker
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {isCurrentMonth ? "This month's balance" : `${format(month, "MMMM yyyy")} balance`}
                        </p>
                    </div>
                    <p className={cn("text-lg font-bold shrink-0", isGet ? "text-emerald-500" : "text-rose-500")}>
                        ₹{Math.abs(viewSummary.netBalance).toLocaleString("en-IN")}
                    </p>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground">
                        Salary ₹{viewSummary.monthlySalary.toLocaleString("en-IN")} • Deduction ₹
                        {viewSummary.dailyDeduction.toLocaleString("en-IN", { maximumFractionDigits: 2 })}/day
                        {viewSummary.openingBalance !== 0 && (
                            <> • Opening ₹{Math.abs(viewSummary.openingBalance).toLocaleString("en-IN")}</>
                        )}
                    </p>
                    <WorkerRateDialog
                        partyId={party.id}
                        monthlySalary={viewSummary.monthlySalary}
                        dailyDeduction={viewSummary.dailyDeduction}
                        trigger={
                            <button type="button" className="text-xs font-semibold text-primary shrink-0">
                                Edit
                            </button>
                        }
                    />
                </div>
            </div>

            <WorkerAttendanceCalendar
                month={month}
                onMonthChange={handleMonthChange}
                dayStatus={dayStatus}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                savingDate={savingDate}
                onSetStatus={handleSetDayStatus}
            />

            <SupplierTransactionList
                transactions={loadingMonth ? [] : viewTransactions}
                onEdit={(t) => openForm(t.type as SupplierTransactionType, t)}
                onAddFirst={() => openForm("GAVE")}
                onDeleted={() => refetch(month)}
            />

            {/* Report FAB and the bottom bar share one fixed anchor, same pattern as the
                plain-supplier detail page. Attendance is edited directly on the calendar
                card above (tap a day, then tap the action that appears) and saves
                immediately — there's no separate Save control down here. */}
            <div className="fixed bottom-[calc(58px+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 md:left-60 right-0 z-30">
                <div className="absolute bottom-full right-4 mb-3 flex items-center gap-2">
                    <WorkerReportSheet
                        party={party}
                        trigger={<Fab label="REPORT" icon={<FileText size={18} />} variant="inline" />}
                    />
                </div>
                <div className="bg-card border-t border-border flex">
                    <button
                        type="button"
                        onClick={() => openForm("GAVE")}
                        className="flex-1 py-3.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-600/90 transition-colors"
                    >
                        YOU GAVE ₹
                    </button>
                    <button
                        type="button"
                        onClick={() => openForm("GOT")}
                        className="flex-1 py-3.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-600/90 transition-colors"
                    >
                        YOU GOT ₹
                    </button>
                </div>
            </div>

            <SupplierTransactionForm
                open={formOpen}
                onOpenChange={(next) => {
                    setFormOpen(next)
                    if (!next) setEditing(null)
                }}
                partyId={party.id}
                partyName={party.name}
                type={formType}
                editing={editing}
                onSaved={handleSaved}
            />

            <SupplierTransactionSuccess
                open={!!success}
                partyName={party.name}
                amount={success?.amount ?? 0}
                onAddAnother={handleAddAnother}
                onDone={() => setSuccess(null)}
            />
        </div>
    )
}
