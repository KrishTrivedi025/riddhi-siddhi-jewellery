"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { FileText } from "lucide-react"
import { PartyFab } from "./party-fab"
import { SupplierKhataHeader } from "./supplier-khata-header"
import { SupplierTransactionList } from "./supplier-transaction-list"
import { SupplierTransactionForm } from "./supplier-transaction-form"
import { SupplierTransactionSuccess } from "./supplier-transaction-success"
import { SupplierReportSheet } from "./supplier-report-sheet"
import type { SupplierTransactionType, SupplierTransactionWithBalance } from "@/lib/actions/supplier-transactions"

interface SupplierKhataDetailProps {
    party: { id: string; name: string; phone: string | null }
    transactions: SupplierTransactionWithBalance[]
    netBalance: number
}

export function SupplierKhataDetail({ party, transactions, netBalance }: SupplierKhataDetailProps) {
    const router = useRouter()
    const [formOpen, setFormOpen] = useState(false)
    const [formType, setFormType] = useState<SupplierTransactionType>("GAVE")
    const [editing, setEditing] = useState<SupplierTransactionWithBalance | null>(null)
    const [success, setSuccess] = useState<{ amount: number } | null>(null)

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

    return (
        <div className="space-y-4 pb-40 md:pb-8">
            <SupplierKhataHeader party={party} netBalance={netBalance} />
            <SupplierTransactionList
                transactions={transactions}
                onEdit={(t) => openForm(t.type as SupplierTransactionType, t)}
                onAddFirst={() => openForm("GAVE")}
            />

            {/* Report FAB and the bottom bar share one fixed anchor so the FAB sits a fixed
                12px above the bar's actual top edge, instead of guessing a viewport-bottom
                offset that has to account for the global bottom nav's safe-area height too. */}
            <div className="fixed bottom-[calc(58px+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 md:left-60 right-0 z-30">
                <div className="absolute bottom-full right-4 mb-3">
                    <SupplierReportSheet
                        party={party}
                        transactions={transactions}
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
