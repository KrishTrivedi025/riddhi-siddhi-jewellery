"use client"

import { FileText } from "lucide-react"
import { SupplierListReportDialog } from "./supplier-list-report-dialog"
import type { SupplierKhataSummary as SupplierKhataSummaryData } from "@/lib/actions/supplier-transactions"

interface SupplierKhataSummaryProps {
    summary: SupplierKhataSummaryData
}

export function SupplierKhataSummary({ summary }: SupplierKhataSummaryProps) {
    return (
        <div className="flex items-stretch rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex-1 px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">You will give</p>
                <p className="text-lg font-bold text-rose-500">
                    ₹{summary.totalWillGive.toLocaleString("en-IN")}
                </p>
            </div>
            <div className="w-px bg-border" />
            <div className="flex-1 px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">You will get</p>
                <p className="text-lg font-bold text-emerald-500">
                    ₹{summary.totalWillGet.toLocaleString("en-IN")}
                </p>
            </div>
            <div className="w-px bg-border" />
            <SupplierListReportDialog
                summary={summary}
                trigger={
                    <button
                        type="button"
                        className="flex flex-col items-center justify-center gap-1 px-4 h-full text-primary text-[11px] font-semibold hover:bg-primary/5 transition-colors"
                    >
                        <FileText size={18} />
                        Report
                    </button>
                }
            />
        </div>
    )
}
