"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
    ArrowLeft, CheckCircle2,
    Ban, Loader2, RotateCcw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/gst-utils"
import { formatItemDisplayName } from "@/lib/utils"
import { numberToWords } from "@/lib/amount-in-words"
import { markPurchaseInvoiceAsPaid, voidPurchaseInvoice } from "@/lib/actions/purchases"
import { toast } from "sonner"
import { useConfirm } from "@/components/shared/confirm-provider"

interface PurchaseDetailProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoice: any
}

export function PurchaseDetail({ invoice }: PurchaseDetailProps) {
    const router = useRouter()
    const [loading, setLoading] = useState("")
    const confirm = useConfirm()

    const handleMarkPaid = async () => {
        setLoading("paid")
        const result = await markPurchaseInvoiceAsPaid(invoice.id)
        setLoading("")
        if (result.success) { toast.success("Purchase marked as paid"); router.refresh() }
        else toast.error(result.error)
    }

    const handleVoid = async () => {
        const ok = await confirm({
            title: "Cancel this purchase?",
            description: "Stock will be reversed (decreased).",
            confirmText: "Cancel Purchase",
            variant: "destructive",
        })
        if (!ok) return
        setLoading("void")
        const result = await voidPurchaseInvoice(invoice.id)
        setLoading("")
        if (result.success) { toast.success("Purchase cancelled"); router.refresh() }
        else toast.error(result.error)
    }

    const isInterState = invoice.igst > 0

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/dashboard/purchases")}
                        className="text-muted-foreground hover:text-foreground hover:bg-border h-9 w-9 p-0"
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">{invoice.invoiceNumber}</h1>
                        <p className="text-sm text-muted-foreground">
                            {format(new Date(invoice.invoiceDate), "dd MMM yyyy")}
                            {invoice.dueDate && ` • Due: ${format(new Date(invoice.dueDate), "dd MMM yyyy")}`}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {invoice.status !== "cancelled" && invoice.paymentStatus !== "paid" && (
                        <Button
                            onClick={handleMarkPaid}
                            disabled={loading === "paid"}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {loading === "paid" ? (
                                <Loader2 size={16} className="mr-2 animate-spin" />
                            ) : (
                                <CheckCircle2 size={16} className="mr-2" />
                            )}
                            Mark Paid
                        </Button>
                    )}
                    {invoice.status === "active" && (
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/dashboard/purchases/returns/new?invoiceId=${invoice.id}`)}
                            className="text-primary border-primary/20 hover:bg-primary/10"
                        >
                            <RotateCcw size={16} className="mr-2" />
                            Return Goods
                        </Button>
                    )}
                    {invoice.status !== "cancelled" && (
                        <Button
                            variant="ghost"
                            onClick={handleVoid}
                            disabled={loading === "void"}
                            className="text-rose-400 hover:bg-rose-400/10"
                        >
                            <Ban size={16} className="mr-2" />
                            Cancel
                        </Button>
                    )}
                </div>
            </div>

            {/* Status Badges */}
            <div className="flex gap-3">
                <Badge className={`${
                    invoice.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                } hover:bg-transparent`}>
                    {invoice.status === "active" ? "Active" : "Cancelled"}
                </Badge>
                <Badge className={`${
                    invoice.paymentStatus === "paid"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : invoice.paymentStatus === "partial"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                } hover:bg-transparent`}>
                    {invoice.paymentStatus.charAt(0).toUpperCase() + invoice.paymentStatus.slice(1)}
                </Badge>
            </div>

            {/* Invoice Card */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Supplier Details */}
                <div className="p-5 grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Supplier</p>
                        <p className="text-foreground font-semibold">{invoice.party?.name}</p>
                        {invoice.party?.gstin && (
                            <p className="text-xs text-muted-foreground mt-1">GSTIN: {invoice.party.gstin}</p>
                        )}
                        {invoice.party?.state && (
                            <p className="text-xs text-muted-foreground">{invoice.party.city}, {invoice.party.state}</p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Vendor Invoice #</p>
                        <p className="text-foreground font-semibold text-sm">{invoice.vendorInvoiceNumber || "—"}</p>
                        <p className="text-xs text-muted-foreground mb-1 mt-3">Supplier State</p>
                        <p className="text-foreground text-sm">{invoice.placeOfSupply || "—"}</p>
                    </div>
                </div>

                <Separator className="bg-border" />

                {/* Line Items Table */}
                <div className="p-5 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="text-muted-foreground text-xs">#</TableHead>
                                <TableHead className="text-muted-foreground text-xs">Item</TableHead>
                                <TableHead className="text-muted-foreground text-xs">HSN</TableHead>
                                <TableHead className="text-muted-foreground text-xs">Purity</TableHead>
                                <TableHead className="text-muted-foreground text-xs text-right">Qty</TableHead>
                                <TableHead className="text-muted-foreground text-xs text-right">Rate</TableHead>
                                <TableHead className="text-muted-foreground text-xs text-right">Disc</TableHead>
                                <TableHead className="text-muted-foreground text-xs text-right">GST</TableHead>
                                <TableHead className="text-muted-foreground text-xs text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {invoice.items?.map((item: any, idx: number) => (
                                <TableRow key={item.id} className="border-border">
                                    <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                                    <TableCell>
                                        <p className="text-foreground text-sm">{formatItemDisplayName(item.itemName, item.item?.category?.name)}</p>
                                        {item.makingCharges > 0 && (
                                            <p className="text-[10px] text-muted-foreground">Making: ₹{item.makingCharges}</p>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{item.hsnCode || "—"}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{item.purity || "—"}</TableCell>
                                    <TableCell className="text-right text-foreground text-sm">
                                        {item.quantity} {item.unit}
                                    </TableCell>
                                    <TableCell className="text-right text-foreground text-sm">
                                        {formatCurrency(item.unitPrice)}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                        {item.discount > 0 ? (
                                            item.discountType === "percent" ? `${item.discount}%` : formatCurrency(item.discount)
                                        ) : "—"}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                        {item.gstRate}%
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-foreground text-sm">
                                        {formatCurrency(item.amount)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <Separator className="bg-border" />

                {/* Totals */}
                <div className="p-5 flex justify-start">
                    <div className="w-80 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="text-foreground">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        {invoice.totalDiscount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Discount</span>
                                <span className="text-emerald-400">-{formatCurrency(invoice.totalDiscount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Taxable Amount</span>
                            <span className="text-foreground">{formatCurrency(invoice.taxableAmount)}</span>
                        </div>
                        <Separator className="bg-border" />
                        {isInterState ? (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">IGST</span>
                                <span className="text-foreground">{formatCurrency(invoice.igst)}</span>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">CGST</span>
                                    <span className="text-foreground">{formatCurrency(invoice.cgst)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">SGST</span>
                                    <span className="text-foreground">{formatCurrency(invoice.sgst)}</span>
                                </div>
                            </>
                        )}
                        {invoice.roundOff !== 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Round Off</span>
                                <span className="text-foreground">{invoice.roundOff > 0 ? "+" : ""}{formatCurrency(invoice.roundOff)}</span>
                            </div>
                        )}
                        <Separator className="bg-border" />
                        <div className="flex justify-between pt-1">
                            <span className="text-foreground font-bold text-base">Grand Total</span>
                            <span className="text-primary font-bold text-lg">{formatCurrency(invoice.grandTotal)}</span>
                        </div>
                        <div className="bg-background rounded-lg p-2 mt-2">
                            <p className="text-xs text-muted-foreground italic">{numberToWords(invoice.grandTotal)}</p>
                        </div>
                        <Separator className="bg-border" />
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Paid</span>
                            <span className="text-emerald-400">{formatCurrency(invoice.amountPaid)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Balance Due</span>
                            <span className={invoice.balanceDue > 0 ? "text-rose-400 font-semibold" : "text-emerald-400"}>
                                {formatCurrency(invoice.balanceDue)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {(invoice.notes || invoice.termsConditions) && (
                    <>
                        <Separator className="bg-border" />
                        <div className="p-5 grid grid-cols-2 gap-6">
                            {invoice.notes && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Internal Notes</p>
                                    <p className="text-sm text-foreground">{invoice.notes}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
