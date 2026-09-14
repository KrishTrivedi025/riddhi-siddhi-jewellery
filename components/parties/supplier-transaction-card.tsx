"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { toast } from "sonner"
import { Edit, FileText, Loader2, Trash2 } from "lucide-react"
import { useConfirm } from "@/components/shared/confirm-provider"
import { deleteSupplierTransaction } from "@/lib/actions/supplier-transactions"
import type { SupplierTransactionWithBalance } from "@/lib/actions/supplier-transactions"
import { AttachmentLightbox } from "./attachment-lightbox"

interface SupplierTransactionCardProps {
    transaction: SupplierTransactionWithBalance
    onEdit: (transaction: SupplierTransactionWithBalance) => void
}

export function SupplierTransactionCard({ transaction, onEdit }: SupplierTransactionCardProps) {
    const [loading, setLoading] = useState(false)
    const [previewIndex, setPreviewIndex] = useState<number | null>(null)
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
        <div className="flex items-start justify-between gap-2 rounded-xl border border-border bg-card p-3.5">
            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-muted-foreground">
                        {format(transaction.date, "d MMM yy")} • {format(transaction.createdAt, "h:mm a")}
                    </p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded bg-current/10 ${balanceColor}`}>
                        Bal. ₹{Math.abs(transaction.runningBalance).toLocaleString("en-IN")}
                    </span>
                    {transaction.paymentMode && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {transaction.paymentMode === "CASH" ? "Cash" : "Online"}
                        </span>
                    )}
                </div>
                {transaction.details && (
                    <p className="text-sm text-foreground">{transaction.details}</p>
                )}
                {transaction.attachments.length > 0 && (
                    <div className="flex gap-1.5 pt-1">
                        {transaction.attachments.map((a, i) => (
                            <button
                                key={a.id}
                                type="button"
                                onClick={() => setPreviewIndex(i)}
                                className="h-10 w-10 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0"
                            >
                                {a.fileType === "image" ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={a.url} alt={a.fileName} className="h-full w-full object-cover" />
                                ) : (
                                    <FileText size={16} className="text-muted-foreground" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
                {transaction.type === "ABSENT" ? (
                    <span className="text-sm font-semibold text-muted-foreground">
                        −₹{transaction.amount.toLocaleString("en-IN")}
                    </span>
                ) : (
                    <div className="flex gap-2 text-sm font-semibold">
                        <span className="w-20 text-right text-rose-500">
                            {transaction.type === "GAVE" ? `₹${transaction.amount.toLocaleString("en-IN")}` : ""}
                        </span>
                        <span className="w-20 text-right text-emerald-500">
                            {transaction.type === "GOT" ? `₹${transaction.amount.toLocaleString("en-IN")}` : ""}
                        </span>
                    </div>
                )}
                {/* Direct, always-visible actions — a Radix dropdown here was unreliable on
                    mobile (a tap could register as opening the menu and selecting its first
                    item in the same gesture); two plain buttons have no such failure mode.
                    An ABSENT row has no Edit — un-marking the day (calendar or Delete here)
                    is the only way to change it. */}
                <div className="flex items-center gap-1">
                    {transaction.type !== "ABSENT" && (
                        <button
                            type="button"
                            onClick={() => onEdit(transaction)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            aria-label="Edit entry"
                        >
                            <Edit size={14} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={loading}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                        aria-label="Delete entry"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                </div>
            </div>

            {previewIndex !== null && transaction.attachments[previewIndex] && (
                <AttachmentLightbox
                    open={previewIndex !== null}
                    onOpenChange={(next) => !next && setPreviewIndex(null)}
                    url={transaction.attachments[previewIndex].url}
                    fileName={transaction.attachments[previewIndex].fileName}
                    fileType={transaction.attachments[previewIndex].fileType as "image" | "pdf"}
                />
            )}
        </div>
    )
}
