"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { startOfMonth } from "date-fns"
import { toast } from "sonner"
import { FileText, Loader2 } from "lucide-react"
import { PartyFab } from "./party-fab"
import { WorkerAttendanceCalendar } from "./worker-attendance-calendar"
import { WorkerRateDialog } from "./worker-rate-dialog"
import { SupplierTransactionList } from "./supplier-transaction-list"
import { SupplierTransactionForm } from "./supplier-transaction-form"
import { SupplierTransactionSuccess } from "./supplier-transaction-success"
import { WorkerReportSheet } from "./worker-report-sheet"
import { Button } from "@/components/ui/button"
import { setWorkerAttendance, type WorkerLedgerSummary } from "@/lib/actions/workers"
import type { SupplierTransactionType, SupplierTransactionWithBalance } from "@/lib/actions/supplier-transactions"
import { cn } from "@/lib/utils"

interface WorkerKhataDetailProps {
    party: { id: string; name: string; phone: string | null }
    transactions: SupplierTransactionWithBalance[]
    summary: WorkerLedgerSummary
}

export function WorkerKhataDetail({ party, transactions, summary }: WorkerKhataDetailProps) {
    const router = useRouter()
    const [formOpen, setFormOpen] = useState(false)
    const [formType, setFormType] = useState<SupplierTransactionType>("GAVE")
    const [editing, setEditing] = useState<SupplierTransactionWithBalance | null>(null)
    const [success, setSuccess] = useState<{ amount: number } | null>(null)
    const [stagedAbsent, setStagedAbsent] = useState<Set<string>>(() => new Set(summary.absentDates))
    const [saving, setSaving] = useState(false)

    const month = useMemo(() => startOfMonth(new Date()), [])

    const isAttendanceDirty = useMemo(() => {
        const committed = summary.absentDates
        if (committed.length !== stagedAbsent.size) return true
        return committed.some((d) => !stagedAbsent.has(d))
    }, [summary.absentDates, stagedAbsent])

    const toggleDate = (dateStr: string) => {
        setStagedAbsent((prev) => {
            const next = new Set(prev)
            if (next.has(dateStr)) next.delete(dateStr)
            else next.add(dateStr)
            return next
        })
    }

    const handleSaveAttendance = async () => {
        setSaving(true)
        try {
            const result = await setWorkerAttendance(party.id, month, Array.from(stagedAbsent))
            if (result.success) {
                toast.success("Attendance updated")
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch {
            toast.error("Failed to save attendance")
        } finally {
            setSaving(false)
        }
    }

    const openForm = (type: SupplierTransactionType, editTransaction?: SupplierTransactionWithBalance) => {
        setFormType(type)
        setEditing(editTransaction ?? null)
        setFormOpen(true)
    }

    const handleSaved = ({ amount, isEdit }: { type: SupplierTransactionType; amount: number; isEdit: boolean }) => {
        setFormOpen(false)
        setEditing(null)
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

    const isGet = summary.netBalance > 0

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
                        <p className="text-xs text-muted-foreground mt-0.5">This month&apos;s balance</p>
                    </div>
                    <p className={cn("text-lg font-bold shrink-0", isGet ? "text-emerald-500" : "text-rose-500")}>
                        ₹{Math.abs(summary.netBalance).toLocaleString("en-IN")}
                    </p>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground">
                        Salary ₹{summary.monthlySalary.toLocaleString("en-IN")} • Deduction ₹
                        {summary.dailyDeduction.toLocaleString("en-IN")}/day
                    </p>
                    <WorkerRateDialog
                        partyId={party.id}
                        monthlySalary={summary.monthlySalary}
                        dailyDeduction={summary.dailyDeduction}
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
                stagedAbsentDates={stagedAbsent}
                onToggleDate={toggleDate}
            />

            <SupplierTransactionList
                transactions={transactions}
                onEdit={(t) => openForm(t.type as SupplierTransactionType, t)}
                onAddFirst={() => openForm("GAVE")}
            />

            {/* Report FAB and the bottom bar share one fixed anchor, same pattern as the
                plain-supplier detail page — the Save button (only while attendance is
                staged) sits immediately to its left in the same row. */}
            <div className="fixed bottom-[calc(58px+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 md:left-60 right-0 z-30">
                <div className="absolute bottom-full right-4 mb-3 flex items-center gap-2">
                    {isAttendanceDirty && (
                        <Button
                            onClick={handleSaveAttendance}
                            disabled={saving}
                            className="h-10 rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold gap-1.5 px-4 shadow-lg"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : "SAVE"}
                        </Button>
                    )}
                    <WorkerReportSheet
                        party={party}
                        trigger={<PartyFab label="REPORT" icon={<FileText size={18} />} variant="inline" />}
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
