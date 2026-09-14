"use client"

import { toast } from "sonner"
import { FileText } from "lucide-react"
import { PartyFab } from "./party-fab"
import { SupplierKhataHeader } from "./supplier-khata-header"
import { SupplierTransactionList } from "./supplier-transaction-list"
import type { SupplierTransactionWithBalance } from "@/lib/actions/supplier-transactions"

interface SupplierKhataDetailProps {
    party: { name: string; phone: string | null }
    transactions: SupplierTransactionWithBalance[]
    netBalance: number
}

export function SupplierKhataDetail({ party, transactions, netBalance }: SupplierKhataDetailProps) {
    // Wired to a placeholder for now — the real transaction entry overlay lands in the next phase.
    const openForm = (type: "GAVE" | "GOT") => {
        toast.info(`Recording what ${type === "GAVE" ? "you gave" : "you got"} is coming very soon`)
    }

    return (
        <div className="space-y-4 pb-40 md:pb-8">
            <SupplierKhataHeader party={party} netBalance={netBalance} />
            <SupplierTransactionList transactions={transactions} />

            <PartyFab
                label="REPORT"
                icon={<FileText size={18} />}
                offset="raised"
                onClick={() => toast.info("Supplier reports are coming soon")}
            />

            <div className="fixed bottom-[calc(58px+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 md:left-60 right-0 z-30 bg-card border-t border-border flex">
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
    )
}
