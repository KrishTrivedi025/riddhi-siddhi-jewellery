"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
            <DialogContent className="bg-card border-border text-foreground sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History size={18} className="text-primary" />
                        Stock History — {item.name}
                    </DialogTitle>
                </DialogHeader>
                <div className="pt-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : movements.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground italic text-sm">
                            No stock movements recorded yet
                        </div>
                    ) : (
                        <div className="max-h-[400px] overflow-y-auto rounded-lg border border-border">
                            <Table>
                                <TableHeader className="bg-muted/50 sticky top-0">
                                    <TableRow className="hover:bg-transparent border-border">
                                        <TableHead className="text-muted-foreground w-[35%]">Date</TableHead>
                                        <TableHead className="text-muted-foreground w-[15%]">Type</TableHead>
                                        <TableHead className="text-muted-foreground w-[20%] text-right">Qty</TableHead>
                                        <TableHead className="text-muted-foreground w-[30%]">Reason</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {movements.map((m) => (
                                        <TableRow
                                            key={m.id}
                                            className="border-border hover:bg-muted transition-colors"
                                        >
                                            <TableCell className="text-xs text-muted-foreground">
                                                {formatDate(m.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                {m.movementType === "in" ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
                                                        <ArrowUpCircle size={12} /> In
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-500">
                                                        <ArrowDownCircle size={12} /> Out
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-foreground">
                                                {m.movementType === "in" ? "+" : "−"}
                                                {m.quantity} {item.unit}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {m.reason || "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
