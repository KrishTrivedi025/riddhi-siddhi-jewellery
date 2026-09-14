"use client"

import { FileText } from "lucide-react"

interface SupplierKhataSummaryProps {
    totalWillGive: number
    totalWillGet: number
    onReportClick: () => void
}

export function SupplierKhataSummary({ totalWillGive, totalWillGet, onReportClick }: SupplierKhataSummaryProps) {
    return (
        <div className="flex items-stretch rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex-1 px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">You will give</p>
                <p className="text-lg font-bold text-rose-500">
                    ₹{totalWillGive.toLocaleString("en-IN")}
                </p>
            </div>
            <div className="w-px bg-border" />
            <div className="flex-1 px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">You will get</p>
                <p className="text-lg font-bold text-emerald-500">
                    ₹{totalWillGet.toLocaleString("en-IN")}
                </p>
            </div>
            <div className="w-px bg-border" />
            <button
                type="button"
                onClick={onReportClick}
                className="flex flex-col items-center justify-center gap-1 px-4 text-primary text-[11px] font-semibold hover:bg-primary/5 transition-colors"
            >
                <FileText size={18} />
                Report
            </button>
        </div>
    )
}
