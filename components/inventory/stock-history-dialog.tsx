"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowUpCircle, ArrowDownCircle, History, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { getStockMovements } from "@/lib/actions/items"

interface StockHistoryDialogProps {
    item: { id: string; name: string; unit: string }
    trigger: React.ReactNode
}

export function StockHistoryDialog({ item, trigger }: StockHistoryDialogProps) {
    const [open, setOpen] = useState(false)
    const [movements, setMovements] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open) {
            setLoading(true)
            getStockMovements(item.id)
                .then(setMovements)
                .catch(console.error)
                .finally(() => setLoading(false))
        }
    }, [open, item.id])

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground sm:max-w-[600px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History size={18} className="text-primary" />
                        Stock History — {item.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pt-2 min-h-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : movements.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground italic text-sm">
                            No stock movements recorded yet
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {movements.map((m) => (
                                <div
                                    key={m.id}
                                    className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-background"
                                >
                                    {/* Left: type badge + date + reason */}
                                    <div className="flex items-start gap-3 min-w-0">
                                        {/* Type icon */}
                                        <div className="shrink-0 mt-0.5">
                                            {m.movementType === "in" ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                    <ArrowUpCircle size={11} /> In
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                                                    <ArrowDownCircle size={11} /> Out
                                                </span>
                                            )}
                                        </div>

                                        {/* Date + reason stacked */}
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</p>
                                            <p className="text-xs text-foreground/70 truncate mt-0.5">
                                                {m.reason || "—"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: qty */}
                                    <span className={`text-sm font-bold shrink-0 ${
                                        m.movementType === "in" ? "text-emerald-500" : "text-rose-500"
                                    }`}>
                                        {m.movementType === "in" ? "+" : "−"}
                                        {m.quantity} {item.unit}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
