"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { toast } from "sonner"
import { Edit, FileText, Loader2, MoreVertical, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useConfirm } from "@/components/shared/confirm-provider"
import { deleteSupplierTransaction } from "@/lib/actions/supplier-transactions"
import type { SupplierTransactionWithBalance } from "@/lib/actions/supplier-transactions"

interface SupplierTransactionCardProps {
    transaction: SupplierTransactionWithBalance
    onEdit: (transaction: SupplierTransactionWithBalance) => void
}

export function SupplierTransactionCard({ transaction, onEdit }: SupplierTransactionCardProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const confirm = useConfirm()

    const isGet = transaction.runningBalance > 0
    const balanceColor =
        transaction.runningBalance === 0
            ? "text-muted-foreground"
            : isGet
            ? "text-emerald-500"
            : "text-rose-500"

    const handleDelete = async () => {
        const ok = await confirm({
            title: "Delete this entry?",
            description: "This transaction will be removed and balances recalculated.",
            confirmText: "Delete",
            variant: "destructive",
        })
        if (!ok) return
        setLoading(true)
        try {
            const result = await deleteSupplierTransaction(transaction.id)
            if (result.success) {
                toast.success("Entry deleted")
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch {
            toast.error("Failed to delete entry")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3.5">
            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-muted-foreground">
                        {format(transaction.date, "d MMM yy")} • {format(transaction.createdAt, "h:mm a")}
                    </p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded bg-current/10 ${balanceColor}`}>
                        Bal. ₹{Math.abs(transaction.runningBalance).toLocaleString("en-IN")}
                    </span>
                </div>
                {transaction.details && (
                    <p className="text-sm text-foreground">{transaction.details}</p>
                )}
                {transaction.attachments.length > 0 && (
                    <div className="flex gap-1.5 pt-1">
                        {transaction.attachments.map((a) => (
                            <a
                                key={a.id}
                                href={a.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-10 w-10 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0"
                            >
                                {a.fileType === "image" ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={a.url} alt={a.fileName} className="h-full w-full object-cover" />
                                ) : (
                                    <FileText size={16} className="text-muted-foreground" />
                                )}
                            </a>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex items-start gap-1.5 shrink-0">
                <div className="flex gap-4 text-sm font-semibold pt-0.5">
                    <span className="w-14 text-right text-rose-500">
                        {transaction.type === "GAVE" ? `₹${transaction.amount.toLocaleString("en-IN")}` : ""}
                    </span>
                    <span className="w-14 text-right text-emerald-500">
                        {transaction.type === "GOT" ? `₹${transaction.amount.toLocaleString("en-IN")}` : ""}
                    </span>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground hover:text-foreground"
                            disabled={loading}
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <MoreVertical size={14} />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                        <DropdownMenuItem
                            onClick={() => onEdit(transaction)}
                            className="flex items-center gap-2 cursor-pointer hover:bg-border"
                        >
                            <Edit size={14} /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handleDelete}
                            className="flex items-center gap-2 text-rose-500 cursor-pointer hover:bg-rose-500/10"
                        >
                            <Trash2 size={14} /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
